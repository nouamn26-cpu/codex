import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";

async function harness() {
  const store = await createStore({ memory: true, seed: true });
  const server = createApp({
    store,
    secret: "test-secret-is-never-used-in-production",
    test: true,
  }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(route, method = "GET", body, token) {
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  }
  async function login(email) {
    const d = await request("/auth/login", "POST", {
      email,
      password: "DemoPass123!",
    });
    assert.equal(d.status, 200);
    return d.token;
  }
  const customer = await login("student@servicehub.demo"),
    provider = await login("tutor@servicehub.demo"),
    admin = await login("admin@servicehub.demo");
  return {
    store,
    request,
    customer,
    provider,
    admin,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await store.close();
    },
  };
}
const future = (hours) => new Date(Date.now() + hours * 3600000).toISOString();
const booking = (extra = {}) => ({
  tutorId: "tutor-1",
  subject: "Mathematics",
  startAt: future(48),
  message: "Please help me with algebra.",
  ...extra,
});

test("server-authoritative booking lifecycle, private messaging and one completed review", async () => {
  const h = await harness();
  try {
    const r = await h.request(
      "/sessions",
      "POST",
      booking({ price: 1, customerId: "someone-else", status: "completed" }),
      h.customer,
    );
    assert.equal(r.status, 201);
    assert.equal(r.session.price, 28);
    assert.equal(r.session.customerId, "demo-customer");
    assert.equal(r.session.status, "requested");
    const sessionId = r.session.id;
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/action`,
          "POST",
          { action: "accept" },
          h.customer,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/review`,
          "POST",
          { rating: 5, text: "Premature" },
          h.customer,
        )
      ).status,
      409,
    );
    const accepted = await h.request(
      `/sessions/${sessionId}/action`,
      "POST",
      { action: "accept" },
      h.provider,
    );
    assert.equal(accepted.session.status, "accepted");
    const message = await h.request(
      `/sessions/${sessionId}/messages`,
      "POST",
      { text: "Hello, here are my learning goals." },
      h.customer,
    );
    assert.equal(message.status, 201);
    const messages = await h.request(
      `/sessions/${sessionId}/messages`,
      "GET",
      null,
      h.provider,
    );
    assert.equal(messages.messages.length, 1);
    assert.equal(
      messages.messages[0].text,
      "Hello, here are my learning goals.",
    );
    assert.equal(
      (await h.request(`/sessions/${sessionId}/messages`, "GET", null, h.admin))
        .status,
      403,
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/action`,
          "POST",
          { action: "complete" },
          h.provider,
        )
      ).session.status,
      "completion_requested",
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/action`,
          "POST",
          { action: "confirm" },
          h.provider,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/action`,
          "POST",
          { action: "confirm" },
          h.customer,
        )
      ).session.status,
      "completed",
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/review`,
          "POST",
          { rating: 4, text: "Clear and helpful!" },
          h.customer,
        )
      ).status,
      201,
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/review`,
          "POST",
          { rating: 5, text: "Duplicate" },
          h.customer,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${sessionId}/action`,
          "POST",
          { action: "cancel" },
          h.customer,
        )
      ).status,
      409,
    );
  } finally {
    await h.close();
  }
});

test("outsiders cannot read or change a session; public signup cannot elevate roles", async () => {
  const h = await harness();
  try {
    assert.equal(
      (
        await h.request("/auth/register", "POST", {
          name: "Hacker",
          email: "hacker@example.test",
          password: "LongPass123!",
          role: "admin",
        })
      ).status,
      400,
    );
    const outsider = await h.request("/auth/register", "POST", {
      name: "New Student",
      email: "new@example.test",
      password: "LongPass123!",
      role: "customer",
    });
    assert.equal(outsider.status, 201);
    const r = await h.request("/sessions", "POST", booking(), h.customer);
    for (const [route, method, body] of [
      [`/sessions/${r.session.id}/messages`, "GET", null],
      [`/sessions/${r.session.id}/messages`, "POST", { text: "intrusion" }],
      [`/sessions/${r.session.id}/action`, "POST", { action: "cancel" }],
    ])
      assert.equal(
        (await h.request(route, method, body, outsider.token)).status,
        403,
      );
    assert.equal(
      (await h.request("/sessions", "GET", null, outsider.token)).sessions
        .length,
      0,
    );
    assert.equal(
      (await h.request("/admin", "GET", null, outsider.token)).status,
      403,
    );
    assert.equal((await h.request("/sessions", "GET")).status, 401);
    assert.equal(
      (await h.request("/sessions", "POST", booking(), h.provider)).status,
      403,
    );
  } finally {
    await h.close();
  }
});

test("serialized acceptance rejects overlapping sessions and cancellation/decline close messaging", async () => {
  const h = await harness();
  try {
    const a = await h.request("/sessions", "POST", booking(), h.customer),
      b = await h.request(
        "/sessions",
        "POST",
        booking({ startAt: future(48.25) }),
        h.customer,
      );
    const results = await Promise.all(
      [a, b].map((r) =>
        h.request(
          `/sessions/${r.session.id}/action`,
          "POST",
          { action: "accept" },
          h.provider,
        ),
      ),
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const accepted = results.find((r) => r.status === 200).session;
    assert.equal(
      (
        await h.request(
          `/sessions/${accepted.id}/action`,
          "POST",
          { action: "cancel" },
          h.customer,
        )
      ).session.status,
      "cancelled",
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${accepted.id}/messages`,
          "POST",
          { text: "Too late" },
          h.customer,
        )
      ).status,
      409,
    );
    const c = await h.request(
      "/sessions",
      "POST",
      booking({ startAt: future(60) }),
      h.customer,
    );
    assert.equal(
      (
        await h.request(
          `/sessions/${c.session.id}/action`,
          "POST",
          { action: "decline" },
          h.provider,
        )
      ).session.status,
      "declined",
    );
    assert.equal(
      (
        await h.request(
          "/sessions",
          "POST",
          booking({ startAt: future(-1) }),
          h.customer,
        )
      ).status,
      400,
    );
  } finally {
    await h.close();
  }
});

test("moderation, listing publishing, suspension invalidation and report resolution", async () => {
  const h = await harness();
  try {
    const report = await h.request(
      "/reports",
      "POST",
      { tutorId: "tutor-1", reason: "Please review this listing." },
      h.customer,
    );
    assert.equal(report.status, 201);
    assert.equal(
      (
        await h.request(
          `/admin/reports/${report.report.id}`,
          "PATCH",
          { status: "resolved" },
          h.customer,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await h.request(
          `/admin/reports/${report.report.id}`,
          "PATCH",
          { status: "resolved" },
          h.admin,
        )
      ).report.status,
      "resolved",
    );
    await h.request(
      "/admin/tutors/tutor-1",
      "PATCH",
      { published: false },
      h.admin,
    );
    assert.equal(
      (await h.request("/tutors")).tutors.some((t) => t.id === "tutor-1"),
      false,
    );
    assert.equal(
      (await h.request("/sessions", "POST", booking(), h.customer)).status,
      404,
    );
    await h.request(
      "/admin/tutors/tutor-1",
      "PATCH",
      { published: true },
      h.admin,
    );
    await h.request(
      "/admin/users/provider-1",
      "PATCH",
      { suspended: true },
      h.admin,
    );
    assert.equal(
      (await h.request("/profile", "GET", null, h.provider)).status,
      401,
    );
    assert.equal(
      (await h.request("/tutors")).tutors.some((t) => t.id === "tutor-1"),
      false,
    );
    assert.equal(
      (
        await h.request(
          "/admin/users/demo-admin",
          "PATCH",
          { suspended: true },
          h.admin,
        )
      ).status,
      400,
    );
  } finally {
    await h.close();
  }
});

test("provider profile validates prices and ignores supplied owner/role", async () => {
  const h = await harness();
  try {
    const profile = {
      headline: "A helpful tutor",
      bio: "Friendly practical lessons.",
      location: "Lahore, PK",
      rate: 25,
      experience: 2,
      subjects: ["Mathematics"],
      userId: "demo-admin",
      published: false,
    };
    assert.equal(
      (await h.request("/profile", "PUT", { ...profile, rate: -1 }, h.provider))
        .status,
      400,
    );
    const saved = await h.request("/profile", "PUT", profile, h.provider);
    assert.equal(saved.status, 200);
    assert.equal(saved.tutor.userId, "provider-1");
    assert.equal(saved.tutor.published, true);
    assert.equal(
      (await h.request("/profile", "PUT", profile, h.customer)).status,
      403,
    );
    assert.equal(
      (
        await h.request("/auth/login", "POST", {
          email: "student@servicehub.demo",
          password: "wrong",
        })
      ).status,
      401,
    );
    const directory = await h.request("/tutors?subject=English&max=25");
    assert.equal(directory.tutors.length, 1);
    assert.equal(directory.tutors[0].name, "Maya Chen");
    assert.equal(JSON.stringify(directory).includes("passwordHash"), false);
  } finally {
    await h.close();
  }
});

test("file adapter survives restart and concurrent mutations without lost records", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "servicehub-"));
  const filePath = path.join(dir, "state.json");
  try {
    const a = await createStore({ filePath, seed: false });
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        a.mutate((s) => {
          s.reports.push({ id: String(i) });
        }),
      ),
    );
    await a.close();
    const b = await createStore({ filePath, seed: false });
    assert.equal((await b.read()).reports.length, 12);
    await b.close();
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
