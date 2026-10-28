import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";

let directory, store, app, customerToken, adminToken, otherToken;
const address = {
  name: "Demo Shopper",
  email: "shopper@example.test",
  street: "123 Fictional Street",
  city: "Lahore",
  postalCode: "54000",
  country: "Pakistan",
};
const orderBody = (
  key,
  items = [{ productId: "keyboard", variantId: "sage", quantity: 1 }],
) => ({ checkoutKey: key, items, address });
const as = (token) => ({ Authorization: `Bearer ${token}` });
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "shopflow-test-"));
  store = await createStore({ file: path.join(directory, "state.json") });
  ({ app } = await createApp({
    store,
    seed: true,
    secret: "a-long-enough-secret-only-used-by-tests",
    authRateLimit: 1000,
    rateLimit: 10000,
  }));
  customerToken = (
    await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@shopflow.demo", password: "Demo12345!" })
      .expect(200)
  ).body.token;
  adminToken = (
    await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@shopflow.demo", password: "Demo12345!" })
      .expect(200)
  ).body.token;
  otherToken = (
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Other Customer",
        email: "other@example.test",
        password: "Demo12345!",
        role: "admin",
      })
      .expect(201)
  ).body.token;
});
after(async () => {
  await store.close();
  await fs.rm(directory, { recursive: true, force: true });
});

test("registration enforces customer role and never exposes password hashes", async () => {
  const { body } = await request(app)
    .get("/api/auth/me")
    .set(as(otherToken))
    .expect(200);
  assert.equal(body.user.role, "customer");
  assert.equal(body.user.passwordHash, undefined);
  await request(app).get("/api/admin/products").set(as(otherToken)).expect(403);
  await request(app).get("/api/admin/orders").expect(401);
  const state = await store.read();
  assert.match(
    state.users.find((u) => u.email === "other@example.test").passwordHash,
    /^\$2/,
  );
});

test("invalid auth and short passwords are rejected", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email: "invalid", password: "short" })
    .expect(400);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@shopflow.demo", password: "wrong" })
    .expect(401);
  await request(app)
    .get("/api/auth/me")
    .set("Authorization", "Bearer invalid")
    .expect(401);
});

test("catalog search and category filters return actual matching products", async () => {
  const { body } = await request(app)
    .get("/api/products?q=wireless&category=Audio")
    .expect(200);
  assert.equal(body.products.length, 1);
  assert.equal(body.products[0]._id, "headphones");
});

test("checkout uses authoritative prices, reserves stock, and is idempotent", async () => {
  const before = (await store.read()).products.find((p) => p._id === "keyboard")
    .variants[0].stock;
  const payload = {
    ...orderBody("checkout-authoritative"),
    priceCents: 1,
    totalCents: 1,
    userId: "demo-admin",
    paymentMode: "real",
    items: [
      { productId: "keyboard", variantId: "sage", quantity: 1, priceCents: 1 },
    ],
  };
  const { body } = await request(app)
    .post("/api/orders")
    .set(as(customerToken))
    .send(payload)
    .expect(201);
  assert.equal(body.order.totalCents, 13650);
  assert.equal(body.order.paymentMode, "simulated");
  assert.equal(body.order.userId, "demo-customer");
  const duplicate = await request(app)
    .post("/api/orders")
    .set(as(customerToken))
    .send(payload)
    .expect(201);
  assert.equal(duplicate.body.order._id, body.order._id);
  const after = (await store.read()).products.find((p) => p._id === "keyboard")
    .variants[0].stock;
  assert.equal(after, before - 1);
});

test("order ownership prevents reading and cancelling another customer order", async () => {
  const { body } = await request(app)
    .get("/api/orders")
    .set(as(customerToken))
    .expect(200);
  const order = body.orders[0];
  const otherOrders = await request(app)
    .get("/api/orders")
    .set(as(otherToken))
    .expect(200);
  assert.equal(otherOrders.body.orders.length, 0);
  await request(app)
    .post(`/api/orders/${order._id}/cancel`)
    .set(as(otherToken))
    .expect(404);
  await request(app)
    .patch(`/api/admin/orders/${order._id}`)
    .set(as(otherToken))
    .send({ status: "delivered" })
    .expect(403);
});

test("cancellation restores stock exactly once", async () => {
  const order = (await request(app).get("/api/orders").set(as(customerToken)))
    .body.orders[0];
  const before = (await store.read()).products.find((p) => p._id === "keyboard")
    .variants[0].stock;
  await request(app)
    .post(`/api/orders/${order._id}/cancel`)
    .set(as(customerToken))
    .expect(200);
  await request(app)
    .post(`/api/orders/${order._id}/cancel`)
    .set(as(customerToken))
    .expect(200);
  const after = (await store.read()).products.find((p) => p._id === "keyboard")
    .variants[0].stock;
  assert.equal(after, before + 1);
});

test("parallel checkouts for the last unit cannot oversell", async () => {
  await store.mutate((state) => {
    state.products.find((p) => p._id === "hub").variants[0].stock = 1;
  });
  const results = await Promise.all(
    ["parallel-one", "parallel-two"].map((key) =>
      request(app)
        .post("/api/orders")
        .set(as(customerToken))
        .send(
          orderBody(key, [
            { productId: "hub", variantId: "slate", quantity: 1 },
          ]),
        ),
    ),
  );
  assert.deepEqual(
    results.map((response) => response.status).sort(),
    [201, 409],
  );
  assert.equal(
    (await store.read()).products.find((p) => p._id === "hub").variants[0]
      .stock,
    0,
  );
});

test("aggregated duplicate variants and negative quantities cannot bypass stock limits", async () => {
  await request(app)
    .post("/api/orders")
    .set(as(customerToken))
    .send(
      orderBody("invalid-quantity", [
        { productId: "keyboard", variantId: "sage", quantity: -2 },
      ]),
    )
    .expect(400);
  await request(app)
    .post("/api/orders")
    .set(as(customerToken))
    .send(
      orderBody("duplicate-limit", [
        { productId: "keyboard", variantId: "sage", quantity: 8 },
        { productId: "keyboard", variantId: "sage", quantity: 8 },
      ]),
    )
    .expect(400);
});

test("admin product changes persist and archived products cannot be purchased", async () => {
  const current = (await store.read()).products.find((p) => p._id === "mouse");
  await request(app)
    .put("/api/admin/products/mouse")
    .set(as(adminToken))
    .send({ ...current, priceCents: 1 })
    .expect(400);
  await request(app)
    .put("/api/admin/products/mouse")
    .set(as(adminToken))
    .send({ ...current, active: false })
    .expect(200);
  await request(app).get("/api/products/mouse").expect(404);
  await request(app)
    .post("/api/orders")
    .set(as(customerToken))
    .send(
      orderBody("archived-item", [
        { productId: "mouse", variantId: "cream", quantity: 1 },
      ]),
    )
    .expect(409);
});

test("order status transitions are constrained and delivered orders cannot be cancelled", async () => {
  const order = (
    await request(app)
      .post("/api/orders")
      .set(as(customerToken))
      .send(
        orderBody("status-transition", [
          { productId: "lamp", variantId: "sand", quantity: 2 },
        ]),
      )
      .expect(201)
  ).body.order;
  assert.equal(order.shippingCents, 0);
  await request(app)
    .patch(`/api/admin/orders/${order._id}`)
    .set(as(adminToken))
    .send({ status: "delivered" })
    .expect(409);
  for (const status of ["processing", "shipped", "delivered"])
    await request(app)
      .patch(`/api/admin/orders/${order._id}`)
      .set(as(adminToken))
      .send({ status })
      .expect(200);
  await request(app)
    .post(`/api/orders/${order._id}/cancel`)
    .set(as(customerToken))
    .expect(409);
});

test("file-backed data survives closing and reopening the store", async () => {
  const reopened = await createStore({
    file: path.join(directory, "state.json"),
  });
  const state = await reopened.read();
  assert.ok(state.orders.length >= 3);
  assert.equal(
    state.products.find((p) => p._id === "hub").variants[0].stock,
    0,
  );
  assert.equal(state.products.find((p) => p._id === "mouse").active, false);
  await reopened.close();
});

test("production refuses a weak signing secret before startup", async () => {
  await assert.rejects(
    () =>
      createApp({ production: true, store, secret: "too-short", seed: false }),
    /JWT_SECRET/,
  );
});
