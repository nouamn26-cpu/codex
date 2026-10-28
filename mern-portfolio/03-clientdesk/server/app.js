import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";

const stages = ["New", "Contacted", "Proposal", "Won", "Lost"];
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
const text = (value, label, max = 120, required = true) => {
  if (typeof value !== "string") {
    if (!required && value === undefined) return "";
    fail(400, `${label} must be text.`);
  }
  const result = value.trim();
  if ((required && !result) || result.length > max)
    fail(400, `${label} must be ${required ? "1" : "0"}–${max} characters.`);
  return result;
};
const email = (value) => {
  const result = text(value, "Email", 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail(400, "Enter a valid email address.");
  return result;
};
const password = (value) => {
  if (
    typeof value !== "string" ||
    value.length < 10 ||
    Buffer.byteLength(value, "utf8") > 72
  )
    fail(
      400,
      "Password must contain at least 10 characters and at most 72 UTF-8 bytes.",
    );
  return value;
};
const choice = (value, allowed, label) => {
  if (!allowed.includes(value)) fail(400, `Choose a valid ${label}.`);
  return value;
};
const publicUser = ({ id, name, email, role, workspaceId }) => ({
  id,
  name,
  email,
  role,
  workspaceId,
});
const hashCode = (code) => createHash("sha256").update(code).digest("hex");
const cleanInvite = ({ codeHash, ...invite }) => invite;

export function createApp({
  store,
  secret,
  development = false,
  disableRateLimit = false,
}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: development ? false : undefined,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (req.body === undefined) req.body = {};
    next();
  });
  if (!disableRateLimit)
    app.use(
      "/api/auth",
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 40,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Too many attempts. Try again in 15 minutes." },
      }),
    );
  const tokenFor = (user) =>
    jwt.sign({ sub: user.id }, secret, {
      expiresIn: "8h",
      issuer: "clientdesk",
    });
  const authenticate = async (req, _res, next) => {
    try {
      const header = req.get("Authorization") || "";
      if (!header.startsWith("Bearer "))
        fail(401, "Please sign in to continue.");
      let claims;
      try {
        claims = jwt.verify(header.slice(7), secret, {
          issuer: "clientdesk",
          algorithms: ["HS256"],
        });
      } catch {
        fail(401, "Your session expired. Please sign in again.");
      }
      req.user = await store.get("users", { id: claims.sub });
      if (!req.user) fail(401, "Account not found. Please sign in again.");
      req.scope = { workspaceId: req.user.workspaceId };
      next();
    } catch (error) {
      next(error);
    }
  };
  const admin = (req, _res, next) => {
    if (req.user.role !== "admin")
      return next(
        Object.assign(new Error("Only workspace admins can do this."), {
          status: 403,
        }),
      );
    next();
  };
  const scopedRecord = async (req, collection) => {
    const row = await store.get(collection, {
      ...req.scope,
      id: req.params.id,
    });
    if (!row) fail(404, "This record was not found in your workspace.");
    return row;
  };

  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", project: "ClientDesk", storage: store.mode }),
  );
  app.post("/api/auth/register", async (req, res) => {
    const name = text(req.body.name, "Name");
    const address = email(req.body.email);
    const rawPassword = password(req.body.password);
    const workspaceName = text(req.body.workspace, "Workspace name", 80);
    if (await store.get("users", { email: address }))
      fail(409, "An account with this email already exists.");
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const workspace = await store.create("workspaces", {
      name: workspaceName,
      currency: "USD",
    });
    const user = await store.create("users", {
      name,
      email: address,
      passwordHash,
      workspaceId: workspace.id,
      role: "admin",
    });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  });
  app.post("/api/auth/login", async (req, res) => {
    const address = email(req.body.email);
    const user = await store.get("users", { email: address });
    const candidate =
      typeof req.body.password === "string"
        ? req.body.password.slice(0, 100)
        : "";
    if (!user || !(await bcrypt.compare(candidate, user.passwordHash)))
      fail(401, "Email or password is incorrect.");
    res.json({ token: tokenFor(user), user: publicUser(user) });
  });
  app.post("/api/auth/join", async (req, res) => {
    const name = text(req.body.name, "Name");
    const address = email(req.body.email);
    const rawPassword = password(req.body.password);
    const code = text(req.body.code, "Invite code", 100);
    if (await store.get("users", { email: address }))
      fail(
        409,
        "This email already has an account. Use a different email to join.",
      );
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const invite = await store.consumeInvite(hashCode(code));
    if (!invite)
      fail(400, "This invite is invalid, expired, revoked or already used.");
    const user = await store.create("users", {
      name,
      email: address,
      passwordHash,
      workspaceId: invite.workspaceId,
      role: "member",
    });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  });
  app.get("/api/bootstrap", authenticate, async (req, res) => {
    const [workspace, leads, clients, tasks, notes, team] = await Promise.all([
      store.get("workspaces", { id: req.user.workspaceId }),
      store.all("leads", req.scope),
      store.all("clients", req.scope),
      store.all("tasks", req.scope),
      store.all("notes", req.scope),
      store.all("users", req.scope),
    ]);
    res.json({
      user: publicUser(req.user),
      workspace,
      leads,
      clients,
      tasks,
      notes,
      team: team.map(publicUser),
      storage: store.mode,
    });
  });

  const leadValues = (body) => {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0 || value > 100000000)
      fail(400, "Lead value must be between 0 and 100,000,000.");
    return {
      name: text(body.name, "Contact name"),
      company: text(body.company, "Company"),
      email: email(body.email),
      value: Math.round(value * 100) / 100,
      stage: choice(body.stage || "New", stages, "pipeline stage"),
      source: choice(
        body.source || "Website",
        ["Website", "Referral", "LinkedIn", "Email", "Other"],
        "lead source",
      ),
    };
  };
  app.post("/api/leads", authenticate, async (req, res) =>
    res
      .status(201)
      .json(
        await store.create("leads", { ...leadValues(req.body), ...req.scope }),
      ),
  );
  app.put("/api/leads/:id", authenticate, async (req, res) => {
    await scopedRecord(req, "leads");
    res.json(
      await store.update(
        "leads",
        { id: req.params.id, ...req.scope },
        leadValues(req.body),
      ),
    );
  });
  app.patch("/api/leads/:id/stage", authenticate, async (req, res) => {
    await scopedRecord(req, "leads");
    res.json(
      await store.update(
        "leads",
        { id: req.params.id, ...req.scope },
        { stage: choice(req.body.stage, stages, "pipeline stage") },
      ),
    );
  });
  app.delete("/api/leads/:id", authenticate, admin, async (req, res) => {
    await scopedRecord(req, "leads");
    await store.remove("leads", { id: req.params.id, ...req.scope });
    res.status(204).end();
  });

  const clientValues = (body) => ({
    name: text(body.name, "Company name"),
    contact: text(body.contact, "Contact name"),
    email: email(body.email),
    industry: text(body.industry, "Industry", 80),
    status: choice(
      body.status || "Active",
      ["Active", "Paused", "Archived"],
      "client status",
    ),
  });
  app.post("/api/clients", authenticate, admin, async (req, res) =>
    res
      .status(201)
      .json(
        await store.create("clients", {
          ...clientValues(req.body),
          ...req.scope,
        }),
      ),
  );
  app.put("/api/clients/:id", authenticate, admin, async (req, res) => {
    await scopedRecord(req, "clients");
    res.json(
      await store.update(
        "clients",
        { id: req.params.id, ...req.scope },
        clientValues(req.body),
      ),
    );
  });
  app.delete("/api/clients/:id", authenticate, admin, async (req, res) => {
    await scopedRecord(req, "clients");
    await store.remove("clients", { id: req.params.id, ...req.scope });
    res.status(204).end();
  });

  const taskValues = async (body, req) => {
    const due = text(body.due, "Due date", 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(due) ||
      Number.isNaN(Date.parse(`${due}T00:00:00.000Z`)) ||
      new Date(`${due}T00:00:00.000Z`).toISOString().slice(0, 10) !== due
    )
      fail(400, "Enter a real due date.");
    const assignedTo =
      req.user.role === "admin"
        ? text(body.assignedTo || req.user.id, "Assignee", 100)
        : req.user.id;
    if (!(await store.get("users", { id: assignedTo, ...req.scope })))
      fail(400, "Assignee must be a member of your workspace.");
    return {
      title: text(body.title, "Task title", 160),
      due,
      assignedTo,
      priority: choice(
        body.priority || "Medium",
        ["High", "Medium", "Low"],
        "priority",
      ),
      status: choice(body.status || "todo", ["todo", "done"], "task status"),
    };
  };
  app.post("/api/tasks", authenticate, async (req, res) =>
    res
      .status(201)
      .json(
        await store.create("tasks", {
          ...(await taskValues(req.body, req)),
          ...req.scope,
        }),
      ),
  );
  app.put("/api/tasks/:id", authenticate, async (req, res) => {
    const task = await scopedRecord(req, "tasks");
    if (req.user.role !== "admin" && task.assignedTo !== req.user.id)
      fail(403, "You can edit only tasks assigned to you.");
    res.json(
      await store.update(
        "tasks",
        { id: req.params.id, ...req.scope },
        await taskValues(req.body, req),
      ),
    );
  });
  app.patch("/api/tasks/:id/status", authenticate, async (req, res) => {
    const task = await scopedRecord(req, "tasks");
    if (req.user.role !== "admin" && task.assignedTo !== req.user.id)
      fail(403, "You can complete only tasks assigned to you.");
    res.json(
      await store.update(
        "tasks",
        { id: req.params.id, ...req.scope },
        { status: choice(req.body.status, ["todo", "done"], "task status") },
      ),
    );
  });
  app.delete("/api/tasks/:id", authenticate, async (req, res) => {
    const task = await scopedRecord(req, "tasks");
    if (req.user.role !== "admin" && task.assignedTo !== req.user.id)
      fail(403, "You can delete only tasks assigned to you.");
    await store.remove("tasks", { id: req.params.id, ...req.scope });
    res.status(204).end();
  });
  app.post("/api/notes", authenticate, async (req, res) =>
    res
      .status(201)
      .json(
        await store.create("notes", {
          body: text(req.body.body, "Note", 3000),
          authorId: req.user.id,
          author: req.user.name,
          ...req.scope,
        }),
      ),
  );
  app.delete("/api/notes/:id", authenticate, async (req, res) => {
    const note = await scopedRecord(req, "notes");
    if (req.user.role !== "admin" && note.authorId !== req.user.id)
      fail(403, "You can delete only your own notes.");
    await store.remove("notes", { id: req.params.id, ...req.scope });
    res.status(204).end();
  });
  app.get("/api/invites", authenticate, admin, async (req, res) =>
    res.json((await store.all("invites", req.scope)).map(cleanInvite)),
  );
  app.post("/api/invites", authenticate, admin, async (req, res) => {
    const code = randomBytes(16).toString("hex");
    const invite = await store.create("invites", {
      ...req.scope,
      codeHash: hashCode(code),
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      usedAt: null,
      revokedAt: null,
    });
    res.status(201).json({ ...cleanInvite(invite), code });
  });
  app.delete("/api/invites/:id", authenticate, admin, async (req, res) => {
    await scopedRecord(req, "invites");
    await store.update(
      "invites",
      { ...req.scope, id: req.params.id },
      { revokedAt: new Date().toISOString() },
    );
    res.status(204).end();
  });
  app.patch("/api/workspace", authenticate, admin, async (req, res) =>
    res.json(
      await store.update(
        "workspaces",
        { id: req.user.workspaceId },
        { name: text(req.body.name, "Workspace name", 80) },
      ),
    ),
  );
  app.get("/api/reports/leads.csv", authenticate, async (req, res) => {
    const rows = await store.all("leads", req.scope);
    const cell = (value) => {
      let safe = String(value ?? "");
      if (/^[=+\-@]/.test(safe)) safe = `'${safe}`;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const csv = [
      ["Contact", "Company", "Email", "Value (USD)", "Stage", "Source"],
      ...rows.map((row) => [
        row.name,
        row.company,
        row.email,
        row.value,
        row.stage,
        row.source,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    res
      .set({
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clientdesk-leads.csv"',
      })
      .send(csv);
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  app.use((error, _req, res, _next) => {
    const status =
      error.code === 11000
        ? 409
        : error.status || (error.type === "entity.parse.failed" ? 400 : 500);
    if (status === 500) console.error(error);
    res
      .status(status)
      .json({
        error:
          status === 500
            ? "Something went wrong. Please try again."
            : error.code === 11000
              ? "This record already exists."
              : error.message,
      });
  });
  return app;
}
