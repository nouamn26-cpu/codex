import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./store.js";
import { createApp } from "./app.js";
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const dev = process.argv.includes("--dev");
const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
)
  throw new Error(
    "Set a unique JWT_SECRET of at least 32 characters in production.",
  );
if (production && !process.env.MONGODB_URI)
  throw new Error(
    "Set MONGODB_URI in production. Local file storage is for local development only.",
  );
const store = await createStore({
  mongoUri: process.env.MONGODB_URI,
  dataDir: process.env.DATA_DIR || path.join(projectRoot, ".data"),
  seed: process.env.SEED_DEMO ? process.env.SEED_DEMO === "true" : !production,
});
const app = createApp({
  store,
  secret:
    process.env.JWT_SECRET || "supportpilot-local-only-change-before-deploying",
  dev,
  apiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
});
let vite;
if (dev) {
  vite = await (
    await import("vite")
  ).createServer({
    configFile: path.join(projectRoot, "vite.config.js"),
    server: { middlewareMode: true, allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(projectRoot, "client/dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(projectRoot, "client/dist/index.html")),
  );
}
const portIndex = process.argv.indexOf("--port");
const port = Number(
  portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4104,
);
if (!Number.isInteger(port) || port < 0 || port > 65535)
  throw new Error("PORT must be a valid port number.");
const server = app.listen(port, "0.0.0.0", () =>
  console.log(
    `SupportPilot ready on port ${server.address().port} (${store.mode}; ${process.env.OPENAI_API_KEY ? "AI configured" : "local knowledge search"})`,
  ),
);
let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  if (vite) await vite.close();
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
  server.closeIdleConnections();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
