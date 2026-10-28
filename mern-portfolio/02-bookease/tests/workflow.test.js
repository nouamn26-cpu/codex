import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";
import { seed, today, slots, id } from "../server/domain.js";
let directory, store, server, base, customer, admin, staff, other, main;
const nextDay = (offset) => {
  const d = new Date(`${today()}T12:00:00+05:00`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const date = nextDay(10);
async function request(route, { token, method = "GET", body } = {}) {
  const response = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
async function login(role) {
  const r = await request("/api/auth/login", {
    method: "POST",
    body: { email: `${role}@bookease.demo`, password: "Demo123!" },
  });
  assert.equal(r.status, 200);
  return r.data.token;
}
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "bookease-test-"));
  store = await createStore({ file: path.join(directory, "state.json") });
  await seed(store);
  const app = createApp({
    store,
    secret: "test-only-secret-abcdefghijklmnopqrstuvwxyz",
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  customer = await login("customer");
  admin = await login("admin");
  staff = await login("staff");
  const r = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Another guest",
      email: "another@example.com",
      password: "Testing123!",
      role: "admin",
    },
  });
  assert.equal(r.data.user.role, "customer");
  other = r.data.token;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await store.close();
  await fs.rm(directory, { recursive: true, force: true });
});

test("catalog is public, credentials and private routes stay protected", async () => {
  const c = await request("/api/catalog");
  assert.equal(c.data.services.length, 6);
  assert.equal(c.data.staff.length, 3);
  assert.equal(c.data.timeZone, "Asia/Karachi");
  assert.ok(!JSON.stringify(c.data).includes("passwordHash"));
  assert.equal((await request("/api/bookings")).status, 401);
  assert.equal(
    (await request("/api/admin/services", { token: customer })).status,
    403,
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: "admin@bookease.demo", password: "wrong" },
      })
    ).status,
    401,
  );
});
test("future slot reservation ignores client prices and ownership fields", async () => {
  const r = await request("/api/bookings", {
    method: "POST",
    token: customer,
    body: {
      serviceId: "signature-cut",
      staffId: "mila",
      date,
      time: "10:00",
      price: 0,
      userId: "demo-admin",
      notes: "Test visit",
    },
  });
  assert.equal(r.status, 201);
  main = r.data.booking;
  assert.equal(main.price, 45);
  assert.equal(main.duration, 45);
  assert.equal(main.userId, "demo-customer");
  assert.equal(r.data.notificationMode, "demo-outbox");
});
test("overlapping durations cannot double book; adjacent slot is allowed", async () => {
  const conflict = await request("/api/bookings", {
    method: "POST",
    token: other,
    body: { serviceId: "blow-dry", staffId: "mila", date, time: "10:30" },
  });
  assert.equal(conflict.status, 409);
  const adjacent = await request("/api/bookings", {
    method: "POST",
    token: other,
    body: { serviceId: "blow-dry", staffId: "mila", date, time: "10:45" },
  });
  assert.equal(adjacent.status, 201);
});
test("concurrent requests for an overlapping slot reserve exactly once", async () => {
  const body = {
    serviceId: "signature-cut",
    staffId: "noah",
    date,
    time: "14:00",
  };
  const result = await Promise.all([
    request("/api/bookings", { method: "POST", token: customer, body }),
    request("/api/bookings", {
      method: "POST",
      token: other,
      body: { ...body, time: "14:15" },
    }),
  ]);
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 409]);
});
test("customer and unrelated staff cannot modify or see another guest booking", async () => {
  assert.equal(
    (
      await request(`/api/bookings/${main.id}`, {
        method: "PATCH",
        token: other,
        body: { action: "cancel" },
      })
    ).status,
    403,
  );
  const privateList = await request("/api/bookings", { token: other });
  assert.ok(!privateList.data.bookings.some((b) => b.id === main.id));
  const unrelated = await request("/api/bookings", {
    method: "POST",
    token: customer,
    body: { serviceId: "skin-reset", staffId: "ava", date, time: "15:00" },
  });
  assert.equal(
    (
      await request(`/api/bookings/${unrelated.data.booking.id}`, {
        method: "PATCH",
        token: staff,
        body: { action: "cancel" },
      })
    ).status,
    403,
  );
});
test("rescheduling is conflict checked and releases the original slot", async () => {
  const blocked = await request(`/api/bookings/${main.id}`, {
    method: "PATCH",
    token: customer,
    body: { action: "reschedule", date, time: "10:30", staffId: "mila" },
  });
  assert.equal(blocked.status, 409);
  const moved = await request(`/api/bookings/${main.id}`, {
    method: "PATCH",
    token: customer,
    body: { action: "reschedule", date, time: "12:00", staffId: "mila" },
  });
  assert.equal(moved.status, 200);
  const available = await request(
    `/api/availability?serviceId=signature-cut&staffId=mila&date=${date}`,
  );
  assert.ok(available.data.slots.includes("10:00"));
  assert.ok(!available.data.slots.includes("12:15"));
});
test("cancellation releases slots and cannot be repeated", async () => {
  const cancelled = await request(`/api/bookings/${main.id}`, {
    method: "PATCH",
    token: customer,
    body: { action: "cancel" },
  });
  assert.equal(cancelled.data.booking.status, "cancelled");
  const available = await request(
    `/api/availability?serviceId=signature-cut&staffId=mila&date=${date}`,
  );
  assert.ok(available.data.slots.includes("12:00"));
  assert.equal(
    (
      await request(`/api/bookings/${main.id}`, {
        method: "PATCH",
        token: customer,
        body: { action: "cancel" },
      })
    ).status,
    409,
  );
});
test("booking validates dates, time boundaries and service durations", async () => {
  for (const invalid of [
    { date: "2026-02-30", time: "10:00" },
    { date: nextDay(-1), time: "10:00" },
    { date: nextDay(181), time: "10:00" },
    { date, time: "18:30" },
    { date, time: "10:07" },
    { date, time: "29:00" },
  ]) {
    const r = await request("/api/bookings", {
      method: "POST",
      token: customer,
      body: { serviceId: "colour-refresh", staffId: "ava", ...invalid },
    });
    assert.ok([400, 409].includes(r.status));
  }
});
test("only elapsed appointments can be completed by the assigned team", async () => {
  const upcoming = await request("/api/bookings", {
    method: "POST",
    token: customer,
    body: { serviceId: "signature-cut", staffId: "mila", date, time: "16:00" },
  });
  assert.equal(
    (
      await request(`/api/bookings/${upcoming.data.booking.id}`, {
        method: "PATCH",
        token: staff,
        body: { action: "complete" },
      })
    ).status,
    409,
  );
  const past = {
    ...upcoming.data.booking,
    id: id(),
    date: nextDay(-1),
    time: "10:00",
  };
  await store.mutate((s) => {
    s.bookings.push(past);
    return null;
  });
  assert.equal(
    (
      await request(`/api/bookings/${past.id}`, {
        method: "PATCH",
        token: customer,
        body: { action: "complete" },
      })
    ).status,
    403,
  );
  const done = await request(`/api/bookings/${past.id}`, {
    method: "PATCH",
    token: staff,
    body: { action: "complete" },
  });
  assert.equal(done.data.booking.status, "completed");
});
test("notification records are honest demos and next-24h reminder generation is idempotent", async () => {
  const start = new Date(Date.now() + 3 * 3600000);
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
  });
  await store.mutate((s) => {
    s.bookings.push({
      id: id(),
      userId: "demo-customer",
      serviceId: "head-massage",
      staffId: "mila",
      date: format.format(start),
      time: timeFormat.format(start),
      duration: 30,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      serviceName: "Reminder test fixture",
      staffName: "Mila Taylor",
      price: 35,
      notes: "",
    });
    return null;
  });
  const first = await request("/api/reminders/run", {
    method: "POST",
    token: admin,
    body: {},
  });
  assert.ok(first.data.created >= 1);
  const again = await request("/api/reminders/run", {
    method: "POST",
    token: admin,
    body: {},
  });
  assert.equal(again.data.created, 0);
  const out = await request("/api/outbox", { token: customer });
  assert.ok(out.data.messages.some((m) => m.kind === "reminder"));
  assert.ok(out.data.messages.every((m) => m.status === "demo"));
  assert.equal(
    (
      await request("/api/reminders/run", {
        method: "POST",
        token: customer,
        body: {},
      })
    ).status,
    403,
  );
});
test("admin can create/pause services; guests cannot alter the catalog", async () => {
  const body = {
    name: "A new ritual",
    category: "Wellness",
    duration: 45,
    price: 59,
    description: "A thoughtful new service for your routine.",
  };
  assert.equal(
    (
      await request("/api/admin/services", {
        method: "POST",
        token: customer,
        body,
      })
    ).status,
    403,
  );
  const result = await request("/api/admin/services", {
    method: "POST",
    token: admin,
    body,
  });
  assert.equal(result.status, 201);
  const paused = await request(
    `/api/admin/services/${result.data.service.id}`,
    { method: "PATCH", token: admin, body: { ...body, active: false } },
  );
  assert.equal(paused.data.service.active, false);
  const c = await request("/api/catalog");
  assert.ok(!c.data.services.some((s) => s.id === result.data.service.id));
});
test("file persistence survives a store reopen", async () => {
  const reopened = await createStore({
    file: path.join(directory, "state.json"),
  });
  const saved = await reopened.read();
  assert.equal(
    saved.bookings.find((b) => b.id === main.id).status,
    "cancelled",
  );
  assert.ok(saved.users.every((u) => u.passwordHash && !u.password));
  await reopened.close();
});
