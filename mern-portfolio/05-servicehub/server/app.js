import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { id } from "./store.js";

const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
const text = (value, label, max = 100) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${label} is required (maximum ${max} characters).`);
  return value.trim();
};
const cleanUser = ({ id, name, email, role, suspended }) => ({
  id,
  name,
  email,
  role,
  suspended,
});
const subjects = [
  "Mathematics",
  "Web Development",
  "English",
  "Physics",
  "Design",
  "Computer Science",
];
export function createApp({ store, secret, test = false }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (req, _res, next) => {
    req.body ??= {};
    next();
  });
  if (!test)
    app.use(
      "/api",
      rateLimit({
        windowMs: 60000,
        limit: 240,
        standardHeaders: "draft-8",
        legacyHeaders: false,
      }),
    );
  const authLimiter = test
    ? (_q, _s, next) => next()
    : rateLimit({
        windowMs: 15 * 60000,
        limit: 30,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Too many sign-in attempts. Please try later." },
      });
  app.get("/api/health", (_q, res) =>
    res.json({ ok: true, app: "ServiceHub", storage: store.mode }),
  );
  app.get("/api/config", (_q, res) =>
    res.json({
      subjects,
      mode: "Portfolio demo",
      payments: "No payments are collected",
      messaging: "Polling every 5 seconds",
    }),
  );
  const token = (user) =>
    jwt.sign({ sub: user.id }, secret, {
      expiresIn: "8h",
      issuer: "servicehub",
      audience: "servicehub-web",
    });
  const authenticate = async (req, _res, next) => {
    try {
      const raw = req.headers.authorization?.split(" ");
      if (raw?.[0] !== "Bearer" || !raw[1]) fail(401, "Please sign in.");
      const claims = jwt.verify(raw[1], secret, {
        issuer: "servicehub",
        audience: "servicehub-web",
      });
      const state = await store.read();
      const user = state.users.find((u) => u.id === claims.sub);
      if (!user || user.suspended) fail(401, "Account unavailable.");
      req.user = cleanUser(user);
      next();
    } catch (e) {
      next(
        e.status
          ? e
          : Object.assign(
              new Error("Your session expired. Please sign in again."),
              { status: 401 },
            ),
      );
    }
  };
  const requireRole =
    (...roles) =>
    (req, _res, next) =>
      roles.includes(req.user.role)
        ? next()
        : next(
            Object.assign(
              new Error("You do not have permission for this action."),
              { status: 403 },
            ),
          );
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const name = text(req.body.name, "Name", 60);
    const email = text(req.body.email, "Email", 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Enter a valid email address.");
    const password = text(req.body.password, "Password", 128);
    if (password.length < 10)
      fail(400, "Use at least 10 characters for your password.");
    if (!["customer", "provider"].includes(req.body.role))
      fail(400, "Choose student or tutor.");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.mutate((s) => {
      if (s.users.some((u) => u.email === email))
        fail(409, "This email is already registered.");
      const u = {
        id: id(),
        name,
        email,
        role: req.body.role,
        passwordHash,
        suspended: false,
      };
      s.users.push(u);
      return cleanUser(u);
    });
    res.status(201).json({ user, token: token(user) });
  });
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const email = text(req.body.email, "Email", 120).toLowerCase();
    const password = text(req.body.password, "Password", 128);
    const s = await store.read();
    const u = s.users.find((u) => u.email === email);
    if (!u || !(await bcrypt.compare(password, u.passwordHash)) || u.suspended)
      fail(401, "Email or password is incorrect, or account is suspended.");
    res.json({ user: cleanUser(u), token: token(u) });
  });
  app.get("/api/auth/me", authenticate, (req, res) =>
    res.json({ user: req.user }),
  );
  const publicTutor = (t, s) => {
    const reviews = s.reviews.filter((r) => r.tutorId === t.id);
    return {
      ...t,
      rating: reviews.length
        ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
        : null,
      reviewCount: reviews.length,
      reviews: reviews.map((r) => ({
        ...r,
        customerName:
          s.users.find((u) => u.id === r.customerId)?.name || "Student",
      })),
    };
  };
  app.get("/api/tutors", async (req, res) => {
    const s = await store.read();
    const q = String(req.query.q || "")
      .toLowerCase()
      .slice(0, 100);
    const subject = String(req.query.subject || "");
    const max = Number(req.query.max || 1000);
    res.json({
      tutors: s.tutors
        .filter(
          (t) =>
            t.published &&
            !s.users.find((u) => u.id === t.userId)?.suspended &&
            (!q ||
              [t.name, t.headline, ...t.subjects]
                .join(" ")
                .toLowerCase()
                .includes(q)) &&
            (!subject || t.subjects.includes(subject)) &&
            t.rate <= (Number.isFinite(max) ? max : 1000),
        )
        .map((t) => publicTutor(t, s)),
    });
  });
  app.get(
    "/api/profile",
    authenticate,
    requireRole("provider"),
    async (req, res) =>
      res.json({
        tutor:
          (await store.read()).tutors.find((t) => t.userId === req.user.id) ||
          null,
        subjects,
      }),
  );
  app.put(
    "/api/profile",
    authenticate,
    requireRole("provider"),
    async (req, res) => {
      const headline = text(req.body.headline, "Headline", 100),
        bio = text(req.body.bio, "Bio", 1500),
        location = text(req.body.location, "Location", 70),
        rate = Number(req.body.rate),
        experience = Number(req.body.experience || 0);
      if (!Number.isFinite(rate) || rate < 5 || rate > 500)
        fail(400, "Hourly rate must be between $5 and $500.");
      if (!Number.isInteger(experience) || experience < 0 || experience > 60)
        fail(400, "Experience must be between 0 and 60 years.");
      const chosen = Array.isArray(req.body.subjects)
        ? [...new Set(req.body.subjects)].filter((s) => subjects.includes(s))
        : [];
      if (!chosen.length) fail(400, "Choose at least one subject.");
      const tutor = await store.mutate((s) => {
        let t = s.tutors.find((t) => t.userId === req.user.id);
        if (!t) {
          t = {
            id: id(),
            userId: req.user.id,
            name: req.user.name,
            createdAt: new Date().toISOString(),
            color: "#f8dfcc",
            initials: req.user.name
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2),
            published: true,
          };
          s.tutors.push(t);
        }
        Object.assign(t, {
          headline,
          bio,
          location,
          rate,
          experience,
          subjects: chosen,
          subject: chosen[0],
        });
        return t;
      });
      res.json({ tutor });
    },
  );
  const findSession = (s, sessionId, user) => {
    const session = s.sessions.find((r) => r.id === sessionId);
    if (!session) fail(404, "Session not found.");
    if (![session.customerId, session.providerId].includes(user.id))
      fail(403, "This session belongs to another account.");
    return session;
  };
  const decorate = (session, s) => ({
    ...session,
    tutorName:
      s.users.find((u) => u.id === session.providerId)?.name || "Tutor",
    customerName:
      s.users.find((u) => u.id === session.customerId)?.name || "Student",
    review: s.reviews.find((r) => r.sessionId === session.id) || null,
  });
  app.get("/api/sessions", authenticate, async (req, res) => {
    const s = await store.read();
    res.json({
      sessions: s.sessions
        .filter((r) => [r.customerId, r.providerId].includes(req.user.id))
        .map((r) => decorate(r, s))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  });
  app.post(
    "/api/sessions",
    authenticate,
    requireRole("customer"),
    async (req, res) => {
      const tutorId = text(req.body.tutorId, "Tutor", 100),
        message = text(req.body.message, "Learning goal", 1000),
        subject = text(req.body.subject, "Subject", 70);
      const date = new Date(req.body.startAt);
      if (
        !Number.isFinite(date.getTime()) ||
        date.getTime() < Date.now() + 15 * 60000 ||
        date.getTime() > Date.now() + 180 * 86400000
      )
        fail(
          400,
          "Choose a time at least 15 minutes ahead and within 180 days.",
        );
      const session = await store.mutate((s) => {
        const t = s.tutors.find((t) => t.id === tutorId && t.published);
        if (!t || s.users.find((u) => u.id === t.userId)?.suspended)
          fail(404, "This tutor is unavailable.");
        if (t.userId === req.user.id) fail(400, "You cannot book yourself.");
        if (!t.subjects.includes(subject))
          fail(400, "This tutor does not offer that subject.");
        const r = {
          id: id(),
          customerId: req.user.id,
          providerId: t.userId,
          tutorId: t.id,
          subject,
          message,
          price: t.rate,
          startAt: date.toISOString(),
          status: "requested",
          createdAt: new Date().toISOString(),
        };
        s.sessions.push(r);
        return decorate(r, s);
      });
      res.status(201).json({ session });
    },
  );
  app.post(
    "/api/sessions/:sessionId/action",
    authenticate,
    async (req, res) => {
      const action = req.body.action;
      const session = await store.mutate((s) => {
        const r = findSession(s, req.params.sessionId, req.user);
        const provider = r.providerId === req.user.id;
        if (action === "accept" && provider && r.status === "requested") {
          if (
            s.sessions.some(
              (o) =>
                o.id !== r.id &&
                o.providerId === r.providerId &&
                ["accepted", "completion_requested"].includes(o.status) &&
                Math.abs(new Date(o.startAt) - new Date(r.startAt)) < 3600000,
            )
          )
            fail(409, "You already have an overlapping accepted session.");
          r.status = "accepted";
        } else if (action === "decline" && provider && r.status === "requested")
          r.status = "declined";
        else if (
          action === "cancel" &&
          !provider &&
          ["requested", "accepted"].includes(r.status)
        )
          r.status = "cancelled";
        else if (action === "complete" && provider && r.status === "accepted")
          r.status = "completion_requested";
        else if (
          action === "confirm" &&
          !provider &&
          r.status === "completion_requested"
        )
          r.status = "completed";
        else
          fail(
            409,
            "This action is not allowed for your role or the current session status.",
          );
        r.updatedAt = new Date().toISOString();
        return decorate(r, s);
      });
      res.json({ session });
    },
  );
  app.get(
    "/api/sessions/:sessionId/messages",
    authenticate,
    async (req, res) => {
      const s = await store.read();
      findSession(s, req.params.sessionId, req.user);
      res.json({
        messages: s.messages
          .filter((m) => m.sessionId === req.params.sessionId)
          .map((m) => ({
            ...m,
            senderName:
              s.users.find((u) => u.id === m.senderId)?.name || "Member",
          })),
      });
    },
  );
  app.post(
    "/api/sessions/:sessionId/messages",
    authenticate,
    async (req, res) => {
      const body = text(req.body.text, "Message", 2000);
      const message = await store.mutate((s) => {
        const r = findSession(s, req.params.sessionId, req.user);
        if (["cancelled", "declined"].includes(r.status))
          fail(409, "Messaging is closed for this session.");
        const m = {
          id: id(),
          sessionId: r.id,
          senderId: req.user.id,
          text: body,
          createdAt: new Date().toISOString(),
        };
        s.messages.push(m);
        return { ...m, senderName: req.user.name };
      });
      res.status(201).json({ message });
    },
  );
  app.post(
    "/api/sessions/:sessionId/review",
    authenticate,
    requireRole("customer"),
    async (req, res) => {
      const rating = Number(req.body.rating),
        reviewText = text(req.body.text, "Review", 1000);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        fail(400, "Choose a rating from 1 to 5.");
      const review = await store.mutate((s) => {
        const r = findSession(s, req.params.sessionId, req.user);
        if (r.customerId !== req.user.id)
          fail(403, "Only the student can review.");
        if (r.status !== "completed")
          fail(409, "Complete this session before leaving a review.");
        if (s.reviews.some((v) => v.sessionId === r.id))
          fail(409, "You already reviewed this session.");
        const v = {
          id: id(),
          sessionId: r.id,
          tutorId: r.tutorId,
          customerId: req.user.id,
          rating,
          text: reviewText,
          createdAt: new Date().toISOString(),
        };
        s.reviews.push(v);
        return v;
      });
      res.status(201).json({ review });
    },
  );
  app.post("/api/reports", authenticate, async (req, res) => {
    const reason = text(req.body.reason, "Reason", 1000),
      tutorId = text(req.body.tutorId, "Tutor", 100);
    const report = await store.mutate((s) => {
      if (!s.tutors.some((t) => t.id === tutorId))
        fail(404, "Tutor not found.");
      const r = {
        id: id(),
        reporterId: req.user.id,
        tutorId,
        reason,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      s.reports.push(r);
      return r;
    });
    res.status(201).json({ report });
  });
  app.get(
    "/api/admin",
    authenticate,
    requireRole("admin"),
    async (_req, res) => {
      const s = await store.read();
      res.json({
        users: s.users.map(cleanUser),
        tutors: s.tutors.map((t) => publicTutor(t, s)),
        reports: s.reports,
        stats: {
          users: s.users.length,
          sessions: s.sessions.length,
          completed: s.sessions.filter((r) => r.status === "completed").length,
          reports: s.reports.filter((r) => r.status === "open").length,
        },
      });
    },
  );
  app.patch(
    "/api/admin/users/:userId",
    authenticate,
    requireRole("admin"),
    async (req, res) => {
      if (typeof req.body.suspended !== "boolean")
        fail(400, "Supply suspended as true or false.");
      const user = await store.mutate((s) => {
        const u = s.users.find((u) => u.id === req.params.userId);
        if (!u) fail(404, "User not found.");
        if (u.role === "admin")
          fail(400, "Admin accounts cannot be suspended here.");
        u.suspended = req.body.suspended;
        return cleanUser(u);
      });
      res.json({ user });
    },
  );
  app.patch(
    "/api/admin/tutors/:tutorId",
    authenticate,
    requireRole("admin"),
    async (req, res) => {
      if (typeof req.body.published !== "boolean")
        fail(400, "Supply published as true or false.");
      const tutor = await store.mutate((s) => {
        const t = s.tutors.find((t) => t.id === req.params.tutorId);
        if (!t) fail(404, "Tutor not found.");
        t.published = req.body.published;
        return t;
      });
      res.json({ tutor });
    },
  );
  app.patch(
    "/api/admin/reports/:reportId",
    authenticate,
    requireRole("admin"),
    async (req, res) => {
      if (!["open", "resolved"].includes(req.body.status))
        fail(400, "Invalid report status.");
      const report = await store.mutate((s) => {
        const r = s.reports.find((r) => r.id === req.params.reportId);
        if (!r) fail(404, "Report not found.");
        r.status = req.body.status;
        return r;
      });
      res.json({ report });
    },
  );
  app.use("/api", (_q, _s, next) =>
    next(Object.assign(new Error("API endpoint not found."), { status: 404 })),
  );
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status === 500 && !test) console.error(error);
    res
      .status(status)
      .json({
        error:
          status === 500
            ? "Something went wrong. Please try again."
            : error.message,
      });
  });
  return app;
}
