import "dotenv/config";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";
import { seed } from "../server/domain.js";

function deploymentConfig() {
  const mongoUri = process.env.MONGODB_URI?.trim();
  const secret = process.env.JWT_SECRET || "";
  if (!mongoUri || secret.length < 32)
    throw new Error(
      "Configure MONGODB_URI and a unique JWT_SECRET before serving API requests.",
    );
  return { mongoUri, secret, seed: process.env.SEED_DEMO === "true" };
}

let runtimePromise;
export function getRuntime() {
  if (!runtimePromise)
    runtimePromise = boot().catch((error) => {
      runtimePromise = undefined;
      throw error;
    });
  return runtimePromise;
}

// Useful for graceful shutdown in local integration checks.
export async function closeRuntime() {
  const pending = runtimePromise;
  runtimePromise = undefined;
  if (pending) {
    const runtime = await pending.catch(() => null);
    await runtime?.store.close();
  }
}

export default async function handler(request, response) {
  try {
    const { app } = await getRuntime();
    await new Promise((resolve, reject) => {
      response.once("finish", resolve);
      response.once("close", resolve);
      response.once("error", reject);
      try {
        app(request, response);
      } catch (error) {
        reject(error);
      }
    });
  } catch {
    if (!response.headersSent) {
      response.statusCode = 503;
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Cache-Control", "no-store");
      response.end(
        JSON.stringify({
          error: "The API is temporarily unavailable. Please retry shortly.",
        }),
      );
    } else if (!response.writableEnded) response.end();
  }
}

async function boot() {
  const config = deploymentConfig();
  const store = await createStore({ mongoUri: config.mongoUri });
  try {
    await seed(store, {
      demo: config.seed,
      adminEmail: process.env.ADMIN_EMAIL,
      adminPassword: process.env.ADMIN_PASSWORD,
    });
    // Keep the documented in-app outbox; no outbound email is configured here.
    return {
      store,
      app: createApp({
        store,
        secret: config.secret,
        production: true,
        demoAccounts: config.seed,
      }),
    };
  } catch (error) {
    await store.close();
    throw error;
  }
}
