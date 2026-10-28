import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

const names = [
  "workspaces",
  "users",
  "leads",
  "clients",
  "tasks",
  "notes",
  "invites",
];
const matches = (row, query) =>
  Object.entries(query).every(([key, value]) => row[key] === value);
const copy = (value) => structuredClone(value);

export class FileStore {
  constructor(filename) {
    this.filename = filename;
    this.mode = "local-file-demo";
    this.queue = Promise.resolve();
  }
  async init() {
    await mkdir(path.dirname(this.filename), { recursive: true });
    try {
      this.data = JSON.parse(await readFile(this.filename, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      this.data = Object.fromEntries(names.map((name) => [name, []]));
    }
    return this;
  }
  async atomic(fn) {
    const operation = this.queue.then(async () => {
      const snapshot = copy(this.data);
      try {
        const result = await fn();
        const tmp = `${this.filename}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(this.data, null, 2), {
          mode: 0o600,
        });
        await rename(tmp, this.filename);
        return copy(result);
      } catch (error) {
        this.data = snapshot;
        throw error;
      }
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
  async all(name, query = {}) {
    await this.queue;
    return copy(this.data[name].filter((row) => matches(row, query)));
  }
  async get(name, query) {
    return (await this.all(name, query))[0] || null;
  }
  async create(name, values) {
    return this.atomic(() => {
      if (
        name === "users" &&
        this.data.users.some((user) => user.email === values.email)
      ) {
        const error = new Error("An account with this email already exists.");
        error.status = 409;
        throw error;
      }
      const row = {
        ...copy(values),
        id: values.id || randomUUID(),
        createdAt: new Date().toISOString(),
      };
      this.data[name].push(row);
      return row;
    });
  }
  async update(name, query, values) {
    return this.atomic(() => {
      const row = this.data[name].find((item) => matches(item, query));
      if (!row) return null;
      Object.assign(row, copy(values), { updatedAt: new Date().toISOString() });
      return row;
    });
  }
  async remove(name, query) {
    return this.atomic(() => {
      const index = this.data[name].findIndex((item) => matches(item, query));
      if (index < 0) return false;
      this.data[name].splice(index, 1);
      return true;
    });
  }
  async consumeInvite(codeHash) {
    return this.atomic(() => {
      const invite = this.data.invites.find(
        (item) =>
          item.codeHash === codeHash &&
          !item.usedAt &&
          !item.revokedAt &&
          new Date(item.expiresAt) > new Date(),
      );
      if (!invite) return null;
      invite.usedAt = new Date().toISOString();
      return invite;
    });
  }
  async close() {
    await this.queue;
  }
}

const fields = {
  workspaces: { name: String, currency: String },
  users: {
    name: String,
    email: { type: String, required: true, unique: true },
    passwordHash: String,
    role: String,
    workspaceId: String,
  },
  leads: {
    workspaceId: String,
    name: String,
    company: String,
    email: String,
    value: Number,
    stage: String,
    source: String,
  },
  clients: {
    workspaceId: String,
    name: String,
    contact: String,
    email: String,
    industry: String,
    status: String,
  },
  tasks: {
    workspaceId: String,
    title: String,
    due: String,
    priority: String,
    status: String,
    assignedTo: String,
  },
  notes: {
    workspaceId: String,
    body: String,
    authorId: String,
    author: String,
  },
  invites: {
    workspaceId: String,
    codeHash: { type: String, unique: true },
    expiresAt: String,
    usedAt: { type: String, default: null },
    revokedAt: { type: String, default: null },
    createdBy: String,
  },
};
export class MongoStore {
  constructor(uri) {
    this.uri = uri;
    this.mode = "mongodb";
  }
  async init() {
    this.connection = await mongoose
      .createConnection(this.uri, { serverSelectionTimeoutMS: 12000 })
      .asPromise();
    this.models = {};
    for (const name of names) {
      const schema = new mongoose.Schema(
        {
          id: { type: String, unique: true, required: true },
          ...fields[name],
          createdAt: String,
          updatedAt: String,
        },
        { versionKey: false, strict: true },
      );
      if (fields[name].workspaceId) schema.index({ workspaceId: 1 });
      this.models[name] = this.connection.model(name, schema);
      await this.models[name].init();
    }
    return this;
  }
  clean(row) {
    if (!row) return null;
    const { _id, ...rest } = row;
    return rest;
  }
  async all(name, query = {}) {
    return (await this.models[name].find(query).lean()).map((row) =>
      this.clean(row),
    );
  }
  async get(name, query) {
    return this.clean(await this.models[name].findOne(query).lean());
  }
  async create(name, values) {
    const row = await this.models[name].create({
      ...values,
      id: values.id || randomUUID(),
      createdAt: new Date().toISOString(),
    });
    return this.clean(row.toObject());
  }
  async update(name, query, values) {
    return this.clean(
      await this.models[name]
        .findOneAndUpdate(
          query,
          { $set: { ...values, updatedAt: new Date().toISOString() } },
          { new: true, runValidators: true },
        )
        .lean(),
    );
  }
  async remove(name, query) {
    return (await this.models[name].deleteOne(query)).deletedCount > 0;
  }
  async consumeInvite(codeHash) {
    const now = new Date().toISOString();
    return this.clean(
      await this.models.invites
        .findOneAndUpdate(
          { codeHash, usedAt: null, revokedAt: null, expiresAt: { $gt: now } },
          { $set: { usedAt: now } },
          { new: true },
        )
        .lean(),
    );
  }
  async close() {
    await this.connection.close();
  }
}

export async function createStore({ mongoUri, filename }) {
  return mongoUri
    ? new MongoStore(mongoUri).init()
    : new FileStore(filename).init();
}
