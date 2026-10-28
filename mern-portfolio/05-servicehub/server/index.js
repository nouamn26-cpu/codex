import "dotenv/config";
import express from "express";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createStore } from "./store.js";
import { createApp } from "./app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
)
  throw new Error(
    "Set JWT_SECRET to a unique random value of at least 32 characters.",
  );
if (production && !process.env.MONGODB_URI)
  throw new Error(
    "MONGODB_URI is required in production. Local file storage is for development only.",
  );
const seed =
  process.env.SEED_DEMO === undefined
    ? !production
    : process.env.SEED_DEMO === "true";
const store = await createStore({
  mongoUri: process.env.MONGODB_URI || "",
  filePath: path.join(root, ".data/servicehub.json"),
  seed,
});
const secret = process.env.JWT_SECRET || randomBytes(48).toString("hex");
const app = createApp({ store, secret });
if (process.argv.includes("--dev")) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    configFile: path.join(root, "vite.config.js"),
    server: { middlewareMode: true, allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(root, "client/dist")));
  app.get("/{*path}", (_q, res) =>
    res.sendFile(path.join(root, "client/dist/index.html")),
  );
}
const portFlag = process.argv.indexOf("--port");
const port = Number(
  (portFlag >= 0 ? process.argv[portFlag + 1] : null) ||
    process.env.PORT ||
    4105,
);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be an integer from 1 to 65535.");
const server = app.listen(port, "0.0.0.0", () =>
  console.log(
    `ServiceHub: http://localhost:${port} (${store.mode}; demo seed ${seed ? "enabled" : "disabled"})`,
  ),
);
async function shutdown() {
  server.close();
  await store.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
