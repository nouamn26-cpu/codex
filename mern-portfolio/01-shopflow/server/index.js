import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { createApp } from "./app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dev = process.argv.includes("--dev");
const cliValue = (name) => {
  const index = process.argv.indexOf(name);
  if (
    index >= 0 &&
    process.argv[index + 1] &&
    !process.argv[index + 1].startsWith("--")
  )
    return process.argv[index + 1];
  return process.argv
    .find((argument) => argument.startsWith(`${name}=`))
    ?.slice(name.length + 1);
};
const cliHost = cliValue("--host");
const { app, store } = await createApp();
let vite;
if (dev) {
  const { createServer } = await import("vite");
  vite = await createServer({
    configFile: path.join(root, "vite.config.js"),
    root: path.join(root, "client"),
    server: {
      middlewareMode: true,
      allowedHosts:
        process.env.PREVIEW_ALLOWED_HOSTS === "true" || cliHost
          ? true
          : undefined,
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const dist = path.join(root, "client/dist");
  if (!existsSync(path.join(dist, "index.html")))
    throw new Error("Build the frontend first: npm run build");
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
const port = Number(cliValue("--port") || process.env.PORT || 4101);
const server = app.listen(
  port,
  cliHost ||
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  () =>
    console.log(
      `ShopFlow ready at http://localhost:${port} · ${store.mode} storage · simulated checkout`,
    ),
);
const shutdown = async () => {
  server.close();
  await vite?.close();
  await store.close();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
