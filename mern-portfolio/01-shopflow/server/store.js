import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

const clone = (x) => structuredClone(x);
const empty = () => ({ users: [], products: [], orders: [] });

export async function createStore({
  file = ".data/shopflow.json",
  mongoUri = "",
} = {}) {
  if (mongoUri) return createMongoStore(mongoUri);
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  let state;
  try {
    state = JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    state = empty();
  }
  let queue = Promise.resolve();
  return {
    mode: "file",
    async read() {
      await queue;
      return clone(state);
    },
    mutate(fn) {
      const job = queue.then(async () => {
        const draft = clone(state);
        const result = fn(draft);
        const temporary = `${file}.${process.pid}.tmp`;
        await fs.writeFile(temporary, JSON.stringify(draft, null, 2), {
          mode: 0o600,
        });
        await fs.rename(temporary, file);
        state = draft;
        return clone(result);
      });
      queue = job.catch(() => {});
      return job;
    },
    async close() {
      await queue;
    },
  };
}

async function createMongoStore(uri) {
  const connection = await mongoose
    .createConnection(uri, { serverSelectionTimeoutMS: 12000 })
    .asPromise();
  const schemaOptions = { versionKey: false };
  const variant = new mongoose.Schema(
    { id: String, label: String, stock: { type: Number, min: 0 } },
    { _id: false },
  );
  const userSchema = new mongoose.Schema(
    {
      _id: String,
      name: String,
      email: { type: String, unique: true },
      passwordHash: String,
      role: { type: String, enum: ["customer", "admin"] },
      createdAt: String,
    },
    schemaOptions,
  );
  const productSchema = new mongoose.Schema(
    {
      _id: String,
      name: String,
      category: String,
      description: String,
      priceCents: { type: Number, min: 1 },
      badge: String,
      art: String,
      color: String,
      active: Boolean,
      variants: [variant],
      createdAt: String,
    },
    schemaOptions,
  );
  const line = new mongoose.Schema(
    {
      productId: String,
      name: String,
      variantId: String,
      variantLabel: String,
      quantity: Number,
      priceCents: Number,
      art: String,
      color: String,
    },
    { _id: false },
  );
  const orderSchema = new mongoose.Schema(
    {
      _id: String,
      userId: { type: String, index: true },
      number: String,
      checkoutKey: String,
      items: [line],
      subtotalCents: Number,
      shippingCents: Number,
      totalCents: Number,
      status: String,
      paymentMode: String,
      address: {
        name: String,
        email: String,
        street: String,
        city: String,
        postalCode: String,
        country: String,
      },
      createdAt: String,
    },
    schemaOptions,
  );
  const models = {
    users: connection.model("User", userSchema),
    products: connection.model("Product", productSchema),
    orders: connection.model("Order", orderSchema),
  };
  const Lock = connection.model(
    "StoreLock",
    new mongoose.Schema({ _id: String, revision: Number }, schemaOptions),
  );
  await Promise.all(Object.values(models).map((model) => model.init()));
  await Lock.updateOne(
    { _id: "checkout" },
    { $setOnInsert: { revision: 0 } },
    { upsert: true },
  );
  async function read(session) {
    const state = {};
    // The Mongo driver does not support parallel operations on one transaction.
    for (const [key, model] of Object.entries(models))
      state[key] = await model
        .find()
        .session(session || null)
        .lean();
    return state;
  }
  let queue = Promise.resolve();
  return {
    mode: "mongodb",
    read: () => read(),
    mutate(fn) {
      const job = queue.then(async () => {
        let result;
        await connection.transaction(async (session) => {
          // All writers contend on this document. Mongo retries write conflicts,
          // then re-reads stock, preventing concurrent overselling across instances.
          await Lock.updateOne(
            { _id: "checkout" },
            { $inc: { revision: 1 } },
            { session },
          );
          const state = await read(session);
          const before = clone(state);
          result = fn(state);
          for (const [key, model] of Object.entries(models)) {
            const previous = new Map(
              before[key].map((document) => [
                document._id,
                JSON.stringify(document),
              ]),
            );
            const currentIds = new Set(
              state[key].map((document) => document._id),
            );
            const operations = [];
            for (const document of state[key]) {
              if (previous.get(document._id) !== JSON.stringify(document)) {
                await new model(document).validate();
                operations.push({
                  replaceOne: {
                    filter: { _id: document._id },
                    replacement: document,
                    upsert: true,
                  },
                });
              }
            }
            for (const id of previous.keys())
              if (!currentIds.has(id))
                operations.push({ deleteOne: { filter: { _id: id } } });
            if (operations.length)
              await model.bulkWrite(operations, { session });
          }
        });
        return clone(result);
      });
      queue = job.catch(() => {});
      return job;
    },
    async close() {
      await queue;
      await connection.close();
    },
  };
}
