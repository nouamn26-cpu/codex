import "dotenv/config";
import path from "node:path";
import express from "express";
import { createStore } from "./store.js";
import { createApp } from "./app.js";
import { seed } from "./domain.js";

const production = process.env.NODE_ENV === "production";
const secret =
  process.env.JWT_SECRET ||
  (production ? "" : "bookease-local-development-only-do-not-publish");
if (
  !secret ||
  (production && (secret.length < 32 || secret.startsWith("replace-with")))
)
  throw new Error(
    "Set JWT_SECRET to a unique random value of at least 32 characters.",
  );
if (production && !process.env.MONGODB_URI)
  throw new Error(
    "Production requires MONGODB_URI. Local file storage is for development only.",
  );
const store = await createStore({ mongoUri: process.env.MONGODB_URI || "" });
const seedDemo =
  process.env.SEED_DEMO === "true" ||
  (!production && process.env.SEED_DEMO !== "false");
await seed(store, {
  demo: seedDemo,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
});
const smtp = process.env.SMTP_HOST
  ? {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {}),
    }
  : null;
const app = createApp({
  store,
  secret,
  smtp,
  production,
  demoAccounts: seedDemo,
});
if (process.argv.includes("--dev")) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const root = path.resolve("client/dist");
  app.use(express.static(root));
  app.use((req, res) =>
    req.accepts("html")
      ? res.sendFile(path.join(root, "index.html"))
      : res.status(404).end(),
  );
}
const portIndex = process.argv.indexOf("--port");
const port = Number(
  portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4102,
);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be between 1 and 65535.");
const server = app.listen(port, "0.0.0.0", () =>
  console.log(
    `BookEase listening on http://localhost:${port} (${store.mode}, ${seedDemo ? "demo accounts enabled" : "demo accounts disabled"})`,
  ),
);
async function stop() {
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
