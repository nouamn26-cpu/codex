import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID, randomBytes } from "node:crypto";
import { createStore } from "./store.js";
import { seedDemo } from "./seed.js";

export const categories = ["Keyboards", "Lighting", "Audio", "Desk essentials"];
const arts = [
  "keyboard",
  "lamp",
  "headphones",
  "stand",
  "mouse",
  "speaker",
  "mat",
  "hub",
];
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (condition, message, status = 400) => {
  if (condition) throw new AppError(status, message);
};
const text = (value, name, min = 1, max = 200) => {
  fail(typeof value !== "string", `${name} is required.`);
  const result = value.trim();
  fail(
    result.length < min || result.length > max,
    `${name} must be ${min}–${max} characters.`,
  );
  return result;
};
const email = (value) => {
  const result = text(value, "Email", 3, 254).toLowerCase();
  fail(
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result),
    "Enter a valid email address.",
  );
  return result;
};
const publicUser = ({ _id, name, email, role }) => ({ _id, name, email, role });
function productInput(body) {
  const result = {
    name: text(body.name, "Product name", 3, 80),
    description: text(body.description, "Description", 20, 2000),
    category: body.category,
    priceCents: body.priceCents,
    badge: typeof body.badge === "string" ? body.badge.trim().slice(0, 20) : "",
    art: body.art,
    color: body.color,
    active: body.active !== false,
  };
  fail(!categories.includes(result.category), "Select a valid category.");
  fail(
    !Number.isInteger(result.priceCents) ||
      result.priceCents < 100 ||
      result.priceCents > 10000000,
    "Price must be between $1 and $100,000.",
  );
  fail(!arts.includes(result.art), "Select a valid illustration.");
  fail(
    !/^#[a-f\d]{6}$/i.test(result.color || ""),
    "Enter a six-digit hex color.",
  );
  fail(
    !Array.isArray(body.variants) ||
      !body.variants.length ||
      body.variants.length > 12,
    "Add 1–12 variants.",
  );
  result.variants = body.variants.map((variant) => {
    const label = text(variant.label, "Variant name", 1, 30);
    const id = text(
      variant.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      "Variant ID",
      1,
      40,
    );
    fail(
      !/^[a-z\d-]+$/i.test(id),
      "Variant ID may contain letters, numbers and hyphens.",
    );
    fail(
      !Number.isInteger(variant.stock) ||
        variant.stock < 0 ||
        variant.stock > 100000,
      "Stock must be a whole number from 0 to 100,000.",
    );
    return { id, label, stock: variant.stock };
  });
  fail(
    new Set(result.variants.map((v) => v.id)).size !== result.variants.length,
    "Variant IDs must be unique.",
  );
  return result;
}
function restoreStock(state, order) {
  for (const item of order.items) {
    const variant = state.products
      .find((product) => product._id === item.productId)
      ?.variants.find((v) => v.id === item.variantId);
    if (variant) variant.stock += item.quantity;
  }
}

export async function createApp(options = {}) {
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const configuredSecret = options.secret || process.env.JWT_SECRET;
  if (production && (!configuredSecret || configuredSecret.length < 32))
    throw new Error(
      "Production requires JWT_SECRET with at least 32 characters.",
    );
  if (production && !options.store && !process.env.MONGODB_URI)
    throw new Error(
      "Production requires MONGODB_URI. Use the local file adapter for development only.",
    );
  const secret = configuredSecret || randomBytes(32).toString("hex");
  const store =
    options.store ||
    (await createStore({
      file: process.env.DATA_FILE || ".data/shopflow.json",
      mongoUri: process.env.MONGODB_URI,
    }));
  const seed =
    options.seed ??
    (process.env.SEED_DEMO === "true" ||
      (!production && process.env.SEED_DEMO !== "false"));
  if (seed) await seedDemo(store);
  const app = express();
  app.disable("x-powered-by");
  if (production) app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: production
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: null,
            },
          }
        : false,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: options.rateLimit || 250,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Try again in a minute." },
    }),
  );
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.authRateLimit || 35,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again later." },
  });
  const token = (user) =>
    jwt.sign({ sub: user._id }, secret, {
      expiresIn: "12h",
      issuer: "shopflow",
    });
  const auth = async (req, res, next) => {
    try {
      const bearer = req.headers.authorization;
      fail(!bearer?.startsWith("Bearer "), "Please sign in to continue.", 401);
      let payload;
      try {
        payload = jwt.verify(bearer.slice(7), secret, { issuer: "shopflow" });
      } catch {
        throw new AppError(401, "Your session expired. Please sign in again.");
      }
      req.user = (await store.read()).users.find(
        (user) => user._id === payload.sub,
      );
      fail(!req.user, "Account not found.", 401);
      next();
    } catch (error) {
      next(error);
    }
  };
  const admin = (req, res, next) =>
    req.user.role === "admin"
      ? next()
      : next(new AppError(403, "Admin access required."));
  app.get("/api/health", (req, res) =>
    res.json({
      ok: true,
      app: "ShopFlow",
      storage: store.mode,
      paymentMode: "simulated",
    }),
  );
  app.get("/api/config", (req, res) =>
    res.json({
      categories,
      paymentMode: "simulated",
      demoAccounts: seed,
      currency: "USD",
    }),
  );
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const name = text(req.body.name, "Name", 2, 70);
    const address = email(req.body.email);
    const password = text(req.body.password, "Password", 10, 128);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.mutate((state) => {
      fail(
        state.users.some((item) => item.email === address),
        "An account already exists with this email.",
        409,
      );
      const result = {
        _id: randomUUID(),
        name,
        email: address,
        passwordHash,
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      state.users.push(result);
      return publicUser(result);
    });
    res.status(201).json({ user, token: token(user) });
  });
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const address = email(req.body.email);
    const password = text(req.body.password, "Password", 1, 128);
    const user = (await store.read()).users.find(
      (item) => item.email === address,
    );
    fail(
      !user || !(await bcrypt.compare(password, user.passwordHash)),
      "Email or password is incorrect.",
      401,
    );
    res.json({ user: publicUser(user), token: token(user) });
  });
  app.get("/api/auth/me", auth, (req, res) =>
    res.json({ user: publicUser(req.user) }),
  );
  app.get("/api/products", async (req, res) => {
    let products = (await store.read()).products.filter(
      (product) => product.active,
    );
    const search = String(req.query.q || "")
      .trim()
      .toLowerCase()
      .slice(0, 100);
    if (search)
      products = products.filter((product) =>
        `${product.name} ${product.description}`.toLowerCase().includes(search),
      );
    if (req.query.category)
      products = products.filter(
        (product) => product.category === req.query.category,
      );
    res.json({ products });
  });
  app.get("/api/products/:id", async (req, res) => {
    const product = (await store.read()).products.find(
      (item) => item._id === req.params.id && item.active,
    );
    fail(!product, "This product is unavailable.", 404);
    res.json({ product });
  });
  app.get("/api/admin/products", auth, admin, async (req, res) =>
    res.json({ products: (await store.read()).products }),
  );
  app.post("/api/admin/products", auth, admin, async (req, res) => {
    const input = productInput(req.body);
    const product = await store.mutate((state) => {
      const result = {
        _id: randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      };
      state.products.push(result);
      return result;
    });
    res.status(201).json({ product });
  });
  app.put("/api/admin/products/:id", auth, admin, async (req, res) => {
    const input = productInput(req.body);
    const product = await store.mutate((state) => {
      const existing = state.products.find(
        (item) => item._id === req.params.id,
      );
      fail(!existing, "Product not found.", 404);
      Object.assign(existing, input);
      return existing;
    });
    res.json({ product });
  });
  app.get("/api/orders", auth, async (req, res) =>
    res.json({
      orders: (await store.read()).orders
        .filter((order) => order.userId === req.user._id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
  );
  app.get("/api/admin/orders", auth, admin, async (req, res) =>
    res.json({
      orders: (await store.read()).orders.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    }),
  );
  app.post("/api/orders", auth, async (req, res) => {
    fail(
      !Array.isArray(req.body.items) ||
        !req.body.items.length ||
        req.body.items.length > 20,
      "Your cart must contain 1–20 items.",
    );
    const checkoutKey = text(req.body.checkoutKey, "Checkout key", 8, 80);
    const input = new Map();
    for (const item of req.body.items) {
      const productId = text(item.productId, "Product ID", 1, 80);
      const variantId = text(item.variantId, "Variant ID", 1, 40);
      fail(
        !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 10,
        "Quantity must be between 1 and 10.",
      );
      const key = `${productId}:${variantId}`;
      const previous = input.get(key);
      const quantity = (previous?.quantity || 0) + item.quantity;
      fail(quantity > 10, "Maximum 10 of each product variant per order.");
      input.set(key, { productId, variantId, quantity });
    }
    const addressInput = req.body.address || {};
    const address = {
      name: text(addressInput.name, "Full name", 2, 70),
      email: email(addressInput.email),
      street: text(addressInput.street, "Street address", 5, 200),
      city: text(addressInput.city, "City", 2, 80),
      postalCode: text(addressInput.postalCode, "Postal code", 2, 20),
      country: text(addressInput.country, "Country", 2, 80),
    };
    const order = await store.mutate((state) => {
      const existing = state.orders.find(
        (item) =>
          item.userId === req.user._id && item.checkoutKey === checkoutKey,
      );
      if (existing) return existing;
      const items = [...input.values()].map((item) => {
        const product = state.products.find(
          (value) => value._id === item.productId && value.active,
        );
        fail(!product, "A product in your cart is no longer available.", 409);
        const variant = product.variants.find(
          (value) => value.id === item.variantId,
        );
        fail(!variant, `Select an available variant for ${product.name}.`, 409);
        fail(
          variant.stock < item.quantity,
          `Only ${variant.stock} ${product.name} (${variant.label}) remaining.`,
          409,
        );
        return {
          ...item,
          name: product.name,
          variantLabel: variant.label,
          priceCents: product.priceCents,
          art: product.art,
          color: product.color,
        };
      });
      const subtotalCents = items.reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0,
      );
      const shippingCents = subtotalCents >= 15000 ? 0 : 750;
      const created = {
        _id: randomUUID(),
        userId: req.user._id,
        checkoutKey,
        number: `SF-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 3).toUpperCase()}`,
        items,
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        status: "placed",
        paymentMode: "simulated",
        address,
        createdAt: new Date().toISOString(),
      };
      for (const item of items)
        state.products
          .find((product) => product._id === item.productId)
          .variants.find((variant) => variant.id === item.variantId).stock -=
          item.quantity;
      state.orders.push(created);
      return created;
    });
    res.status(201).json({ order });
  });
  app.post("/api/orders/:id/cancel", auth, async (req, res) => {
    const order = await store.mutate((state) => {
      const result = state.orders.find(
        (item) => item._id === req.params.id && item.userId === req.user._id,
      );
      fail(!result, "Order not found.", 404);
      if (result.status === "cancelled") return result;
      fail(
        result.status !== "placed",
        "This order is already being processed. Contact the store to make a change.",
        409,
      );
      result.status = "cancelled";
      restoreStock(state, result);
      return result;
    });
    res.json({ order });
  });
  app.patch("/api/admin/orders/:id", auth, admin, async (req, res) => {
    const transitions = {
      placed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    const order = await store.mutate((state) => {
      const result = state.orders.find((item) => item._id === req.params.id);
      fail(!result, "Order not found.", 404);
      fail(
        !transitions[result.status].includes(req.body.status),
        "That order status change is not allowed.",
        409,
      );
      if (req.body.status === "cancelled") restoreStock(state, result);
      result.status = req.body.status;
      return result;
    });
    res.json({ order });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((error, req, res, next) => {
    const status =
      error.status || (error.type === "entity.too.large" ? 413 : 500);
    if (status >= 500) console.error("ShopFlow request failed:", error.message);
    res
      .status(status)
      .json({
        error:
          status >= 500
            ? "Something went wrong. Please try again."
            : error.message,
      });
  });
  return { app, store };
}
