import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const id = () => randomUUID();
const blank = () => ({
  users: [],
  tutors: [],
  sessions: [],
  messages: [],
  reviews: [],
  reports: [],
});

export async function demoData() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 10);
  const users = [
    {
      id: "demo-customer",
      name: "Alex Morgan",
      email: "student@servicehub.demo",
      role: "customer",
      passwordHash,
      suspended: false,
    },
    {
      id: "demo-admin",
      name: "Sam Admin",
      email: "admin@servicehub.demo",
      role: "admin",
      passwordHash,
      suspended: false,
    },
    ...[
      "Aisha Khan",
      "Daniel Brooks",
      "Maya Chen",
      "Omar Hassan",
      "Sofia Rivera",
      "James Wilson",
    ].map((name, i) => ({
      id: `provider-${i + 1}`,
      name,
      email:
        i === 0 ? "tutor@servicehub.demo" : `tutor${i + 1}@servicehub.demo`,
      role: "provider",
      passwordHash,
      suspended: false,
    })),
  ];
  const descriptions = [
    [
      "Mathematics",
      "Math that finally makes sense.",
      "I turn tricky problems into small, clear steps. From algebra foundations to calculus, we will build confidence one lightbulb moment at a time.",
      28,
      ["Mathematics", "Physics"],
      "Lahore, PK",
      6,
      "#d9e9de",
      "AK",
    ],
    [
      "Web Development",
      "Build something you are proud of.",
      "Learn JavaScript, React and the web by making real projects. Practical lessons, thoughtful feedback and plenty of time for your questions.",
      35,
      ["Web Development", "Computer Science"],
      "London, UK",
      8,
      "#e4dff0",
      "DB",
    ],
    [
      "English",
      "Find your voice in English.",
      "Friendly conversation practice, clear writing feedback and IELTS preparation tailored to your goals. Every lesson is a safe space to try.",
      24,
      ["English"],
      "Singapore, SG",
      5,
      "#f8dfcc",
      "MC",
    ],
    [
      "Physics",
      "Big ideas. Clear explanations.",
      "Understand the why behind the equations. Visual explanations and guided practice for high school and first-year university physics.",
      30,
      ["Physics", "Mathematics"],
      "Karachi, PK",
      7,
      "#dce7f3",
      "OH",
    ],
    [
      "Design",
      "Bring your creative ideas to life.",
      "Explore UI design, typography and Figma through hands-on exercises and portfolio feedback. Thoughtful design is a skill you can learn.",
      32,
      ["Design"],
      "Madrid, ES",
      4,
      "#f1dde4",
      "SR",
    ],
    [
      "Computer Science",
      "Make complex concepts click.",
      "Patient guidance through programming fundamentals, algorithms and data structures. We focus on understanding, not memorizing.",
      38,
      ["Computer Science", "Web Development"],
      "Toronto, CA",
      9,
      "#eee6cf",
      "JW",
    ],
  ];
  const tutors = descriptions.map((d, i) => ({
    id: `tutor-${i + 1}`,
    userId: `provider-${i + 1}`,
    name: users[i + 2].name,
    subject: d[0],
    headline: d[1],
    bio: d[2],
    rate: d[3],
    subjects: d[4],
    location: d[5],
    experience: d[6],
    color: d[7],
    initials: d[8],
    published: true,
    createdAt: new Date().toISOString(),
  }));
  const session = {
    id: "demo-completed",
    customerId: "demo-customer",
    providerId: "provider-1",
    tutorId: "tutor-1",
    subject: "Mathematics",
    price: 28,
    startAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "completed",
    createdAt: new Date().toISOString(),
    message: "Review algebra fundamentals.",
  };
  return {
    users,
    tutors,
    sessions: [session],
    messages: [],
    reviews: [
      {
        id: "demo-review",
        sessionId: session.id,
        tutorId: "tutor-1",
        customerId: "demo-customer",
        rating: 5,
        text: "Patient, clear, and encouraging. I finally understand the concepts!",
        createdAt: new Date().toISOString(),
      },
    ],
    reports: [],
  };
}

// The small demo uses one bounded state document. Mongo CAS prevents a second
// server instance from silently overwriting another write. See README for scale limits.
export async function createStore({
  mongoUri = "",
  filePath = path.resolve(".data/servicehub.json"),
  seed = true,
  memory = false,
} = {}) {
  let connection, model, cached;
  if (mongoUri) {
    connection = await mongoose
      .createConnection(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .asPromise();
    const stateSchema = new mongoose.Schema(
      {
        _id: String,
        revision: { type: Number, default: 0 },
        data: { type: mongoose.Schema.Types.Mixed, required: true },
      },
      { versionKey: false, collection: "servicehub_state" },
    );
    model = connection.model("ServiceHubState", stateSchema);
    const initial = seed ? await demoData() : blank();
    await model.updateOne(
      { _id: "main" },
      { $setOnInsert: { revision: 0, data: initial } },
      { upsert: true },
    );
  } else if (memory) cached = seed ? await demoData() : blank();
  else {
    try {
      cached = JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      cached = seed ? await demoData() : blank();
      await persist(cached);
    }
  }
  async function persist(data) {
    if (memory) return;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.${process.pid}.${id()}.tmp`;
    await fs.writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fs.rename(temp, filePath);
  }
  let queue = Promise.resolve();
  return {
    mode: model ? "mongodb" : memory ? "memory" : "file",
    async read() {
      return structuredClone(
        model ? (await model.findById("main").lean()).data : cached,
      );
    },
    mutate(fn) {
      const operation = queue.then(async () => {
        for (let attempt = 0; attempt < 8; attempt++) {
          const doc = model ? await model.findById("main").lean() : null;
          const data = structuredClone(doc ? doc.data : cached);
          const result = await fn(data);
          if (model) {
            const saved = await model.updateOne(
              { _id: "main", revision: doc.revision },
              { $set: { data }, $inc: { revision: 1 } },
            );
            if (!saved.modifiedCount) continue;
          } else {
            await persist(data);
            cached = data;
          }
          return structuredClone(result);
        }
        const error = new Error(
          "Another update is in progress. Please try again.",
        );
        error.status = 409;
        throw error;
      });
      queue = operation.catch(() => {});
      return operation;
    },
    async close() {
      await queue;
      if (connection) await connection.close();
    },
  };
}
