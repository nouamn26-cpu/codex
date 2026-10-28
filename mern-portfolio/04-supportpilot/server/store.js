import mongoose from "mongoose";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export const id = () => crypto.randomUUID();
export const iso = () => new Date().toISOString();
const empty = () => ({
  users: [],
  workspaces: [],
  articles: [],
  conversations: [],
  tickets: [],
});

export async function seedData() {
  const now = iso(),
    passwordHash = await bcrypt.hash("Demo123!", 10);
  const workspaceId = id(),
    otherId = id(),
    ownerId = id(),
    visitorId = id();
  const articles = [
    [
      "Returns & refunds",
      "Orders",
      "You can return unused products within 30 days of delivery. Include your order number when contacting support. Refunds are processed to your original payment method within 5–7 business days after we receive and inspect the return. Shipping fees are not refundable.",
    ],
    [
      "Shipping & delivery",
      "Orders",
      "Standard shipping takes 3–5 business days. Express delivery takes 1–2 business days. Shipping is free on orders over $75. You will receive a tracking link by email when your order ships. We currently ship within the United States only.",
    ],
    [
      "Reset your password",
      "Account",
      "To reset your password, select Forgot password on the store sign-in page. Enter the email address on your account. Follow the link in your email within 30 minutes. If no email arrives, check your spam folder or ask our support team for help.",
    ],
    [
      "Subscription & billing",
      "Billing",
      "You can cancel your subscription at any time from Account > Billing > Cancel subscription in our store. Your access continues until the end of the current billing period. Monthly plans are billed on the same date each month. We accept Visa and Mastercard.",
    ],
  ].map(([title, category, content]) => ({
    id: id(),
    workspaceId,
    title,
    category,
    content,
    source: "Seeded demo article",
    createdAt: now,
    updatedAt: now,
  }));
  const conversationId = id();
  return {
    workspaces: [
      {
        id: workspaceId,
        name: "Acme Studio",
        slug: "acme-studio",
        createdAt: now,
      },
      {
        id: otherId,
        name: "Orbit Company",
        slug: "orbit-company",
        createdAt: now,
      },
    ],
    users: [
      {
        id: ownerId,
        workspaceId,
        name: "Alex Morgan",
        email: "owner@supportpilot.demo",
        role: "admin",
        passwordHash,
        createdAt: now,
      },
      {
        id: visitorId,
        workspaceId,
        name: "Jamie Chen",
        email: "customer@supportpilot.demo",
        role: "customer",
        passwordHash,
        createdAt: now,
      },
      {
        id: id(),
        workspaceId: otherId,
        name: "Orbit Owner",
        email: "orbit@supportpilot.demo",
        role: "admin",
        passwordHash,
        createdAt: now,
      },
    ],
    articles,
    conversations: [
      {
        id: conversationId,
        workspaceId,
        userId: visitorId,
        title: "A question about my order",
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: id(),
            role: "user",
            content: "Can you help me with a damaged order?",
            createdAt: now,
          },
        ],
      },
    ],
    tickets: [
      {
        id: id(),
        workspaceId,
        userId: visitorId,
        conversationId,
        subject: "A question about my order",
        status: "open",
        createdAt: now,
        updatedAt: now,
        replies: [
          {
            id: id(),
            userId: visitorId,
            author: "Jamie Chen",
            role: "customer",
            content:
              "My order arrived damaged. Can someone help with a replacement?",
            createdAt: now,
          },
        ],
      },
    ],
  };
}

// A small demo stores a bounded domain snapshot. Mongo uses optimistic CAS so
// concurrent processes cannot silently overwrite each other's writes.
export async function createStore({
  mongoUri = "",
  dataDir = ".data",
  seed = true,
} = {}) {
  let conn,
    Model,
    cached,
    queue = Promise.resolve();
  const filename = path.resolve(dataDir, "supportpilot.json");
  if (mongoUri) {
    conn = await mongoose
      .createConnection(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .asPromise();
    const schema = new mongoose.Schema(
      { _id: String, revision: Number, data: mongoose.Schema.Types.Mixed },
      { versionKey: false },
    );
    Model = conn.model("SupportPilotState", schema);
    const initial = seed ? await seedData() : empty();
    try {
      await Model.updateOne(
        { _id: "main" },
        { $setOnInsert: { revision: 0, data: initial } },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  } else {
    await mkdir(path.dirname(filename), { recursive: true });
    try {
      cached = JSON.parse(await readFile(filename, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      cached = seed ? await seedData() : empty();
      await writeFile(filename, JSON.stringify(cached, null, 2));
    }
  }
  const read = async () =>
    Model
      ? structuredClone((await Model.findById("main").lean()).data)
      : structuredClone(cached);
  function mutate(fn) {
    const operation = queue.then(async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        const doc = Model ? await Model.findById("main").lean() : null;
        const draft = structuredClone(doc ? doc.data : cached);
        const result = await fn(draft);
        if (Model) {
          const updated = await Model.updateOne(
            { _id: "main", revision: doc.revision },
            { $set: { data: draft }, $inc: { revision: 1 } },
          );
          if (!updated.modifiedCount) continue;
        } else {
          const temporary = `${filename}.${id()}.tmp`;
          await writeFile(temporary, JSON.stringify(draft, null, 2));
          await rename(temporary, filename);
          cached = draft;
        }
        return structuredClone(result);
      }
      throw Object.assign(new Error("Workspace is busy. Please retry."), {
        status: 409,
      });
    });
    queue = operation.catch(() => {});
    return operation;
  }
  return {
    read,
    mutate,
    mode: Model ? "mongodb" : "local-file",
    close: async () => {
      await queue;
      if (conn) await conn.close();
    },
  };
}
