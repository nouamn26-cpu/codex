import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { access } from "node:fs/promises";
import { createApp } from "./app.js";
import { createStore } from "./store.js";
import { seedDemo } from "./seed.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const development = process.argv.includes("--dev");
const production = process.env.NODE_ENV === "production";
const mongoUri = process.env.MONGODB_URI?.trim();
const secret =
  process.env.JWT_SECRET ||
  (production
    ? ""
    : "clientdesk-local-development-only-change-before-deploying");
if (production && secret.length < 32)
  throw new Error(
    "Set JWT_SECRET to at least 32 random characters in production.",
  );
if (production && !mongoUri)
  throw new Error(
    "Set MONGODB_URI in production. Local JSON storage is for development only.",
  );
const store = await createStore({
  mongoUri,
  filename: process.env.DATA_FILE || path.join(root, ".data/clientdesk.json"),
});
const seed = process.env.SEED_DEMO
  ? process.env.SEED_DEMO === "true"
  : !production;
if (seed) await seedDemo(store);
const app = createApp({ store, secret, development });
let vite;
if (development) {
  const { createServer } = await import("vite");
  vite = await createServer({
    configFile: path.join(root, "vite.config.js"),
    server: { middlewareMode: true, allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const dist = path.join(root, "client/dist");
  try {
    await access(path.join(dist, "index.html"));
  } catch {
    throw new Error("Build the frontend first: npm run build");
  }
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
const portArgument =
  process.argv.find((value) => value.startsWith("--port="))?.slice(7) ||
  (process.argv.includes("--port")
    ? process.argv[process.argv.indexOf("--port") + 1]
    : "");
const port = Number(portArgument || process.env.PORT || 4103);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT/--port must be an integer from 1 to 65535.");
const server = app.listen(port, "0.0.0.0", () =>
  console.log(
    `ClientDesk: http://localhost:${port} | storage: ${store.mode} | demo seed: ${seed}`,
  ),
);
async function shutdown() {
  server.close();
  await vite?.close();
  await store.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
