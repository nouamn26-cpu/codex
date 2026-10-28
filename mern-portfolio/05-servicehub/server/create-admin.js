import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { createStore, id } from "./store.js";

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  password = process.env.ADMIN_PASSWORD || "",
  name = (process.env.ADMIN_NAME || "Community Admin").trim();
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  password.length < 12 ||
  password.length > 128
)
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (12–128 characters) in your private environment.",
  );
if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI)
  throw new Error("MONGODB_URI is required in production.");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = await createStore({
  mongoUri: process.env.MONGODB_URI || "",
  filePath: path.join(root, ".data/servicehub.json"),
  seed: false,
});
try {
  const passwordHash = await bcrypt.hash(password, 12);
  await store.mutate((s) => {
    if (s.users.some((u) => u.email === email))
      throw new Error("Email already exists. Use a different bootstrap email.");
    s.users.push({
      id: id(),
      name,
      email,
      passwordHash,
      role: "admin",
      suspended: false,
    });
  });
  console.log(
    "Admin account created. Remove ADMIN_PASSWORD from your environment now.",
  );
} finally {
  await store.close();
}
