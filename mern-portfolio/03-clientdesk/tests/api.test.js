import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import jwt from "jsonwebtoken";
import { createApp } from "../server/app.js";
import { FileStore } from "../server/store.js";
import { seedDemo } from "../server/seed.js";

let store, server, base, directory, admin, member, other;
const secret = "test-secret-for-clientdesk-workspace-tests";
async function request(route, method = "GET", body, token) {
  const response = await fetch(`${base}/api${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data, headers: response.headers };
}
async function login(email) {
  const result = await request("/auth/login", "POST", {
    email,
    password: "DemoPass123!",
  });
  assert.equal(result.status, 200);
  return result.data.token;
}
const lead = (extra) => ({
  name: "Test Contact",
  company: "Example Agency",
  email: "contact@example.com",
  value: 2500,
  stage: "New",
  source: "Website",
  ...extra,
});
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "clientdesk-test-"));
  store = await new FileStore(path.join(directory, "state.json")).init();
  await seedDemo(store);
  server = createApp({ store, secret, disableRateLimit: true }).listen(
    0,
    "127.0.0.1",
  );
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
  admin = await login("owner@clientdesk.demo");
  member = await login("member@clientdesk.demo");
  other = await login("other@clientdesk.demo");
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await store.close();
  await rm(directory, { recursive: true, force: true });
});

test("bootstrap requires a valid token and contains no password hashes", async () => {
  assert.equal((await request("/bootstrap")).status, 401);
  assert.equal(
    (await request("/bootstrap", "GET", null, "fake-token")).status,
    401,
  );
  const result = await request("/bootstrap", "GET", null, admin);
  assert.equal(result.status, 200);
  assert.equal(result.data.workspace.name, "Studio North");
  assert.ok(
    result.data.leads.every((item) => item.workspaceId === "workspace-demo"),
  );
  assert.ok(!JSON.stringify(result.data).includes("passwordHash"));
});

test("lead create/edit/move/delete persists, validates fields and ignores workspace injection", async () => {
  const created = await request(
    "/leads",
    "POST",
    lead({ workspaceId: "workspace-other", id: "injected-id" }),
    admin,
  );
  assert.equal(created.status, 201);
  assert.equal(created.data.workspaceId, "workspace-demo");
  assert.notEqual(created.data.id, "injected-id");
  const id = created.data.id;
  assert.equal(
    (await request("/leads", "POST", lead({ value: -1 }), admin)).status,
    400,
  );
  assert.equal(
    (await request("/leads", "POST", lead({ email: "invalid" }), admin)).status,
    400,
  );
  assert.equal(
    (await request(`/leads/${id}/stage`, "PATCH", { stage: "Made up" }, admin))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        `/leads/${id}/stage`,
        "PATCH",
        { stage: "Proposal" },
        member,
      )
    ).data.stage,
    "Proposal",
  );
  const updated = await request(
    `/leads/${id}`,
    "PUT",
    lead({ company: "Edited Company", value: 4000, stage: "Won" }),
    admin,
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.data.company, "Edited Company");
  const reread = await new FileStore(path.join(directory, "state.json")).init();
  assert.equal((await reread.get("leads", { id })).value, 4000);
  await reread.close();
  assert.equal(
    (await request(`/leads/${id}`, "DELETE", null, member)).status,
    403,
  );
  assert.equal(
    (await request(`/leads/${id}`, "DELETE", null, admin)).status,
    204,
  );
  assert.equal(
    (await request(`/leads/${id}`, "PUT", lead(), admin)).status,
    404,
  );
});

test("other workspace data cannot be edited, moved or deleted by guessing an ID", async () => {
  const foreign = (await request("/bootstrap", "GET", null, other)).data
    .leads[0];
  assert.equal(
    (await request(`/leads/${foreign.id}`, "PUT", lead(), admin)).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/leads/${foreign.id}/stage`,
        "PATCH",
        { stage: "Won" },
        admin,
      )
    ).status,
    404,
  );
  assert.equal(
    (await request(`/leads/${foreign.id}`, "DELETE", null, admin)).status,
    404,
  );
  const mine = (await request("/bootstrap", "GET", null, admin)).data;
  assert.ok(!mine.leads.some((item) => item.id === foreign.id));
  assert.ok(mine.team.every((item) => item.workspaceId === "workspace-demo"));
});

test("clients require admin rights and remain isolated between workspaces", async () => {
  const body = {
    name: "Test Company",
    contact: "Test User",
    email: "test@example.com",
    industry: "Design",
    status: "Active",
    workspaceId: "workspace-other",
  };
  assert.equal((await request("/clients", "POST", body, member)).status, 403);
  const created = await request("/clients", "POST", body, admin);
  assert.equal(created.status, 201);
  assert.equal(created.data.workspaceId, "workspace-demo");
  assert.equal(
    (
      await request(
        `/clients/${created.data.id}`,
        "PUT",
        { ...body, status: "Paused" },
        admin,
      )
    ).data.status,
    "Paused",
  );
  assert.equal(
    (await request(`/clients/${created.data.id}`, "DELETE", null, other))
      .status,
    404,
  );
  assert.equal(
    (await request(`/clients/${created.data.id}`, "DELETE", null, admin))
      .status,
    204,
  );
});

test("task ownership, assignee scope and actual calendar dates are enforced", async () => {
  const body = {
    title: "A test task",
    due: "2027-02-12",
    priority: "High",
    assignedTo: "user-owner",
    status: "todo",
  };
  const created = await request("/tasks", "POST", body, member);
  assert.equal(created.status, 201);
  assert.equal(created.data.assignedTo, "user-member");
  assert.equal(
    (
      await request(
        "/tasks",
        "POST",
        { ...body, assignedTo: "user-other" },
        admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("/tasks", "POST", { ...body, due: "2027-02-30" }, admin))
      .status,
    400,
  );
  const adminTask = await request("/tasks", "POST", body, admin);
  assert.equal(
    (
      await request(
        `/tasks/${adminTask.data.id}/status`,
        "PATCH",
        { status: "done" },
        member,
      )
    ).status,
    403,
  );
  assert.equal(
    (await request(`/tasks/${adminTask.data.id}`, "DELETE", null, member))
      .status,
    403,
  );
  assert.equal(
    (
      await request(
        `/tasks/${created.data.id}/status`,
        "PATCH",
        { status: "done" },
        member,
      )
    ).data.status,
    "done",
  );
  assert.equal(
    (
      await request(
        `/tasks/${created.data.id}`,
        "PUT",
        { ...body, title: "Updated task", status: "done" },
        member,
      )
    ).data.title,
    "Updated task",
  );
  assert.equal(
    (await request(`/tasks/${created.data.id}`, "DELETE", null, other)).status,
    404,
  );
  assert.equal(
    (await request(`/tasks/${created.data.id}`, "DELETE", null, member)).status,
    204,
  );
});

test("notes preserve the authenticated author and cannot be deleted by another member", async () => {
  const ownerNote = (
    await request("/bootstrap", "GET", null, admin)
  ).data.notes.find((note) => note.authorId === "user-owner");
  assert.equal(
    (await request(`/notes/${ownerNote.id}`, "DELETE", null, member)).status,
    403,
  );
  const created = await request(
    "/notes",
    "POST",
    {
      body: "Meeting note",
      authorId: "user-owner",
      workspaceId: "workspace-other",
    },
    member,
  );
  assert.equal(created.status, 201);
  assert.equal(created.data.authorId, "user-member");
  assert.equal(created.data.workspaceId, "workspace-demo");
  assert.equal(
    (await request(`/notes/${created.data.id}`, "DELETE", null, other)).status,
    404,
  );
  assert.equal(
    (await request(`/notes/${created.data.id}`, "DELETE", null, member)).status,
    204,
  );
});

test("registration creates a new workspace, hashes passwords, and ignores injected role/scope", async () => {
  const result = await request("/auth/register", "POST", {
    name: "New Owner",
    email: "new@example.com",
    password: "StrongPassword123!",
    workspace: "New Agency",
    workspaceId: "workspace-demo",
    role: "member",
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.user.role, "admin");
  assert.notEqual(result.data.user.workspaceId, "workspace-demo");
  const privateRecord = await store.get("users", { email: "new@example.com" });
  assert.notEqual(privateRecord.passwordHash, "StrongPassword123!");
  assert.ok(privateRecord.passwordHash.startsWith("$2"));
  const bootstrap = await request("/bootstrap", "GET", null, result.data.token);
  assert.equal(bootstrap.data.leads.length, 0);
  assert.equal(bootstrap.data.clients.length, 0);
  assert.equal(
    (
      await request("/auth/register", "POST", {
        name: "Again",
        email: "new@example.com",
        password: "StrongPassword123!",
        workspace: "Another",
      })
    ).status,
    409,
  );
});

test("invite codes are single-use, expiring, revocable and cannot grant admin role", async () => {
  assert.equal((await request("/invites", "POST", {}, member)).status, 403);
  const invitation = await request("/invites", "POST", {}, admin);
  assert.equal(invitation.status, 201);
  assert.equal(invitation.data.code.length, 32);
  assert.ok(!("codeHash" in invitation.data));
  const list = await request("/invites", "GET", null, admin);
  assert.ok(!JSON.stringify(list.data).includes(invitation.data.code));
  assert.ok(!JSON.stringify(list.data).includes("codeHash"));
  const joined = await request("/auth/join", "POST", {
    name: "New Member",
    email: "joined@example.com",
    password: "StrongPassword123!",
    code: invitation.data.code,
    role: "admin",
    workspaceId: "workspace-other",
  });
  assert.equal(joined.status, 201);
  assert.equal(joined.data.user.role, "member");
  assert.equal(joined.data.user.workspaceId, "workspace-demo");
  assert.equal(
    (
      await request("/auth/join", "POST", {
        name: "Reuse",
        email: "reuse@example.com",
        password: "StrongPassword123!",
        code: invitation.data.code,
      })
    ).status,
    400,
  );
  const revoked = await request("/invites", "POST", {}, admin);
  assert.equal(
    (await request(`/invites/${revoked.data.id}`, "DELETE", null, admin))
      .status,
    204,
  );
  assert.equal(
    (
      await request("/auth/join", "POST", {
        name: "Revoked",
        email: "revoked@example.com",
        password: "StrongPassword123!",
        code: revoked.data.code,
      })
    ).status,
    400,
  );
  const expired = await request("/invites", "POST", {}, admin);
  await store.update(
    "invites",
    { id: expired.data.id },
    { expiresAt: new Date(Date.now() - 1000).toISOString() },
  );
  assert.equal(
    (
      await request("/auth/join", "POST", {
        name: "Expired",
        email: "expired@example.com",
        password: "StrongPassword123!",
        code: expired.data.code,
      })
    ).status,
    400,
  );
});

test("token role claims never override current database permissions", async () => {
  const forgedRole = jwt.sign(
    { sub: "user-member", role: "admin", workspaceId: "workspace-other" },
    secret,
    { expiresIn: "1h", issuer: "clientdesk" },
  );
  assert.equal((await request("/invites", "POST", {}, forgedRole)).status, 403);
  const result = await request("/bootstrap", "GET", null, forgedRole);
  assert.equal(result.data.user.role, "member");
  assert.equal(result.data.workspace.id, "workspace-demo");
});

test("CSV exports only the caller workspace and neutralizes formula cells", async () => {
  const created = await request(
    "/leads",
    "POST",
    lead({ name: "=SUM(1,2)", company: "CSV TEST" }),
    admin,
  );
  const result = await request("/reports/leads.csv", "GET", null, admin);
  assert.equal(result.status, 200);
  assert.match(result.headers.get("content-type"), /text\/csv/);
  assert.ok(result.data.includes("'=SUM(1,2)"));
  assert.ok(!result.data.includes("Other Studio client"));
  await request(`/leads/${created.data.id}`, "DELETE", null, admin);
});
