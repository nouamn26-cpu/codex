import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

const keys = ["users", "services", "staff", "bookings", "outbox"];
export const emptyState = () => Object.fromEntries(keys.map((k) => [k, []]));
const copy = (value) => structuredClone(value);

// File mode is intentionally for one local Node process. Mongo mode uses real
// collections + transactions and a unique staff/date/15-minute reservation index.
export async function createStore({
  mongoUri = "",
  file = path.resolve(".data/bookease.json"),
} = {}) {
  if (!mongoUri) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    let state;
    try {
      state = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      state = emptyState();
    }
    let tail = Promise.resolve();
    return {
      mode: "local-file",
      async read() {
        await tail;
        return copy(state);
      },
      mutate(fn) {
        const next = tail.then(async () => {
          const draft = copy(state);
          const result = fn(draft);
          const temp = `${file}.${process.pid}.tmp`;
          await fs.writeFile(temp, JSON.stringify(draft, null, 2), {
            mode: 0o600,
          });
          await fs.rename(temp, file);
          state = draft;
          return copy(result);
        });
        tail = next.catch(() => {});
        return next;
      },
      async close() {
        await tail;
      },
    };
  }
  const connection = await mongoose
    .createConnection(mongoUri, { serverSelectionTimeoutMS: 15000 })
    .asPromise();
  const schemas = {
    users: {
      id: String,
      name: String,
      email: { type: String, unique: true },
      passwordHash: String,
      role: String,
    },
    services: {
      id: String,
      name: String,
      category: String,
      duration: Number,
      price: Number,
      description: String,
      icon: String,
      active: Boolean,
    },
    staff: {
      id: String,
      userId: String,
      name: String,
      title: String,
      initials: String,
      color: String,
    },
    bookings: {
      id: String,
      userId: String,
      serviceId: String,
      staffId: String,
      date: String,
      time: String,
      duration: Number,
      status: String,
      createdAt: String,
      serviceName: String,
      staffName: String,
      price: Number,
      notes: String,
    },
    outbox: {
      id: String,
      bookingId: String,
      userId: String,
      kind: String,
      to: String,
      subject: String,
      text: String,
      status: String,
      createdAt: String,
      error: String,
    },
  };
  const models = Object.fromEntries(
    keys.map((k) => [
      k,
      connection.model(
        k,
        new mongoose.Schema(
          { _id: String, ...schemas[k] },
          { versionKey: false },
        ),
        k,
      ),
    ]),
  );
  const Meta = connection.model(
    "meta",
    new mongoose.Schema(
      { _id: String, revision: Number },
      { versionKey: false },
    ),
    "meta",
  );
  const reservationSchema = new mongoose.Schema(
    {
      _id: String,
      staffId: String,
      date: String,
      minute: Number,
      bookingId: String,
    },
    { versionKey: false },
  );
  reservationSchema.index({ staffId: 1, date: 1, minute: 1 }, { unique: true });
  const Reservation = connection.model(
    "reservation",
    reservationSchema,
    "reservations",
  );
  await Promise.all(
    [...Object.values(models), Meta, Reservation].map((m) => m.init()),
  );
  await Meta.updateOne(
    { _id: "state" },
    { $setOnInsert: { revision: 0 } },
    { upsert: true },
  );
  async function read(session) {
    const value = emptyState();
    for (const k of keys)
      value[k] = (await models[k].find({}, null, { session }).lean()).map(
        ({ _id, ...row }) => row,
      );
    return value;
  }
  function reservations(state) {
    return state.bookings
      .filter((b) => b.status === "confirmed")
      .flatMap((b) => {
        const [h, m] = b.time.split(":").map(Number);
        const start = h * 60 + m;
        return Array.from({ length: b.duration / 15 }, (_, i) => ({
          _id: `${b.id}:${i}`,
          staffId: b.staffId,
          date: b.date,
          minute: start + i * 15,
          bookingId: b.id,
        }));
      });
  }
  async function sync(model, previous, next, session) {
    const before = new Map(previous.map((r) => [r.id ?? r._id, r]));
    const after = new Map(next.map((r) => [r.id ?? r._id, r]));
    const removed = [...before.keys()].filter((id) => !after.has(id));
    if (removed.length)
      await model.deleteMany({ _id: { $in: removed } }, { session });
    for (const [id, row] of after)
      if (JSON.stringify(before.get(id)) !== JSON.stringify(row))
        await model.replaceOne(
          { _id: id },
          { _id: id, ...row },
          { upsert: true, session },
        );
  }
  return {
    mode: "mongodb",
    read: () => read(),
    async mutate(fn) {
      const session = await connection.startSession();
      let result;
      try {
        await session.withTransaction(async () => {
          // The revision write serializes cross-document validation: two bookings
          // cannot both pass availability validation against an old snapshot.
          await Meta.updateOne(
            { _id: "state" },
            { $inc: { revision: 1 } },
            { session },
          );
          const before = await read(session);
          const draft = copy(before);
          result = fn(draft);
          // Remove prior reservation rows before inserting the new layout.
          await sync(Reservation, reservations(before), [], session);
          const locks = reservations(draft);
          if (locks.length)
            await Reservation.insertMany(locks, { session, ordered: true });
          for (const k of keys)
            await sync(models[k], before[k], draft[k], session);
        });
        return copy(result);
      } finally {
        await session.endSession();
      }
    },
    close: () => connection.close(),
  };
}
