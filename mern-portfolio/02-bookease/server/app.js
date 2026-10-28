import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  id,
  fail,
  publicUser,
  slots,
  validateSlot,
  notification,
  dateTime,
  ZONE,
} from "./domain.js";

const text = (value, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
export function createApp({
  store,
  secret,
  smtp = null,
  production = false,
  demoAccounts = true,
}) {
  const app = express();
  app.disable("x-powered-by");
  if (production) app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: production ? undefined : false }));
  app.use(express.json({ limit: "64kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 500,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Please try again later." },
  });
  const sign = (user) =>
    jwt.sign({}, secret, {
      subject: user.id,
      expiresIn: "8h",
      algorithm: "HS256",
    });
  const smtpEnabled = Boolean(smtp?.host);
  const transport = smtpEnabled ? nodemailer.createTransport(smtp) : null;
  async function deliver(item) {
    if (!transport || !item) return;
    let status = "sent",
      error = "";
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || "BookEase <bookings@example.com>",
        to: item.to,
        subject: item.subject,
        text: item.text,
      });
    } catch {
      status = "failed";
      error =
        "Email provider could not deliver this message. Check your SMTP configuration.";
    }
    await store.mutate((s) => {
      const row = s.outbox.find((o) => o.id === item.id);
      if (row) Object.assign(row, { status, error });
      return null;
    });
  }
  async function auth(req, res, next) {
    try {
      const token = req.get("Authorization")?.replace(/^Bearer /, "");
      if (!token) fail(401, "Please sign in to continue.");
      let payload;
      try {
        payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
      } catch {
        fail(401, "Your session has expired. Please sign in.");
      }
      const state = await store.read();
      req.user = state.users.find((u) => u.id === payload.sub);
      if (!req.user) fail(401, "Your account could not be found.");
      next();
    } catch (error) {
      next(error);
    }
  }
  function canManage(user, booking, state) {
    if (user.role === "admin") return true;
    if (user.role === "customer") return booking.userId === user.id;
    return state.staff.some(
      (s) => s.id === booking.staffId && s.userId === user.id,
    );
  }
  function staffOnly(req, res, next) {
    if (!["admin", "staff"].includes(req.user.role))
      return next(
        Object.assign(new Error("Staff access required."), { status: 403 }),
      );
    next();
  }
  function adminOnly(req, res, next) {
    if (req.user.role !== "admin")
      return next(
        Object.assign(new Error("Administrator access required."), {
          status: 403,
        }),
      );
    next();
  }
  app.get("/api/health", (req, res) =>
    res.json({
      ok: true,
      storage: store.mode,
      timeZone: ZONE,
      notifications: smtpEnabled ? "smtp" : "demo-outbox",
      demoAccounts,
    }),
  );
  app.get("/api/catalog", async (req, res) => {
    const s = await store.read();
    res.json({
      services: s.services.filter((x) => x.active),
      staff: s.staff,
      timeZone: ZONE,
      openingHours: "10:00–19:00 daily",
    });
  });
  app.get("/api/availability", async (req, res) => {
    const s = await store.read();
    res.json({
      slots: slots(s, {
        serviceId: text(req.query.serviceId, 100),
        staffId: text(req.query.staffId, 100),
        date: text(req.query.date, 10),
      }),
      timeZone: ZONE,
    });
  });
  app.post("/api/auth/register", loginLimiter, async (req, res) => {
    const name = text(req.body.name, 80),
      email = text(req.body.email, 254).toLowerCase(),
      password = req.body.password;
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 100
    )
      fail(
        400,
        "Enter your name, a valid email and a password of 8–100 characters.",
      );
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.mutate((s) => {
      if (s.users.some((u) => u.email === email))
        fail(409, "An account with that email already exists.");
      const row = { id: id(), name, email, passwordHash, role: "customer" };
      s.users.push(row);
      return publicUser(row);
    });
    res.status(201).json({ user, token: sign(user) });
  });
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const state = await store.read();
    const email = text(req.body.email, 254).toLowerCase();
    const user = state.users.find((u) => u.email === email);
    const password =
      typeof req.body.password === "string" && req.body.password.length <= 100
        ? req.body.password
        : "";
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      fail(401, "Email or password is incorrect.");
    res.json({ user: publicUser(user), token: sign(user) });
  });
  app.get("/api/auth/me", auth, (req, res) =>
    res.json({ user: publicUser(req.user) }),
  );
  app.get("/api/bookings", auth, async (req, res) => {
    const state = await store.read();
    const bookings = state.bookings
      .filter((b) => canManage(req.user, b, state))
      .map((b) => ({
        ...b,
        customerName:
          state.users.find((u) => u.id === b.userId)?.name || "Customer",
      }))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    res.json({ bookings });
  });
  app.post("/api/bookings", auth, async (req, res) => {
    const result = await store.mutate((state) => {
      const { service, staff } = validateSlot(state, req.body);
      const booking = {
        id: id(),
        userId: req.user.id,
        serviceId: service.id,
        staffId: staff.id,
        date: req.body.date,
        time: req.body.time,
        duration: service.duration,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        serviceName: service.name,
        staffName: staff.name,
        price: service.price,
        notes: text(req.body.notes, 500),
      };
      state.bookings.push(booking);
      const outbox = notification(state, booking, "booked", smtpEnabled);
      return { booking, outbox };
    });
    await deliver(result.outbox);
    res
      .status(201)
      .json({
        booking: result.booking,
        notificationMode: smtpEnabled ? "smtp" : "demo-outbox",
      });
  });
  app.patch("/api/bookings/:bookingId", auth, async (req, res) => {
    const result = await store.mutate((state) => {
      const booking = state.bookings.find((b) => b.id === req.params.bookingId);
      if (!booking) fail(404, "Appointment not found.");
      if (!canManage(req.user, booking, state))
        fail(403, "You cannot change this appointment.");
      if (booking.status !== "confirmed")
        fail(409, "Only confirmed appointments can be changed.");
      if (req.body.action === "complete") {
        if (req.user.role === "customer")
          fail(403, "Only the team can complete appointments.");
        if (
          dateTime(booking.date, booking.time).getTime() +
            booking.duration * 60000 >
          Date.now()
        )
          fail(409, "This appointment has not finished yet.");
        booking.status = "completed";
        return { booking, outbox: null };
      }
      if (dateTime(booking.date, booking.time) <= new Date())
        fail(409, "Past appointments cannot be changed.");
      if (req.body.action === "cancel") {
        booking.status = "cancelled";
        return {
          booking,
          outbox: notification(state, booking, "cancelled", smtpEnabled),
        };
      }
      if (req.body.action !== "reschedule")
        fail(400, "Choose cancel, reschedule or complete.");
      const input = {
        serviceId: booking.serviceId,
        staffId: req.body.staffId || booking.staffId,
        date: req.body.date,
        time: req.body.time,
      };
      const { service, staff } = validateSlot(state, input, booking.id);
      if (req.user.role === "staff" && staff.userId !== req.user.id)
        fail(403, "Staff can only reschedule their own appointments.");
      Object.assign(booking, {
        date: input.date,
        time: input.time,
        staffId: staff.id,
        staffName: staff.name,
        duration: service.duration,
      });
      return {
        booking,
        outbox: notification(state, booking, "rescheduled", smtpEnabled),
      };
    });
    await deliver(result.outbox);
    res.json({ booking: result.booking });
  });
  app.get("/api/outbox", auth, async (req, res) => {
    const state = await store.read();
    const visible = new Set(
      state.bookings
        .filter((b) => canManage(req.user, b, state))
        .map((b) => b.id),
    );
    res.json({
      mode: smtpEnabled ? "smtp" : "demo-outbox",
      messages: state.outbox
        .filter((o) => visible.has(o.bookingId))
        .slice(0, 100),
    });
  });
  app.post("/api/reminders/run", auth, staffOnly, async (req, res) => {
    const result = await store.mutate((state) => {
      const upcoming = state.bookings.filter(
        (b) =>
          b.status === "confirmed" &&
          canManage(req.user, b, state) &&
          dateTime(b.date, b.time) > new Date() &&
          dateTime(b.date, b.time) < new Date(Date.now() + 86400000),
      );
      const items = upcoming
        .filter(
          (b) =>
            !state.outbox.some(
              (o) =>
                o.bookingId === b.id &&
                o.kind === "reminder" &&
                o.text.includes(`${b.date} at ${b.time}`),
            ),
        )
        .map((b) => notification(state, b, "reminder", smtpEnabled));
      return items;
    });
    for (const item of result) await deliver(item);
    res.json({
      created: result.length,
      mode: smtpEnabled ? "smtp" : "demo-outbox",
    });
  });
  app.get("/api/admin/services", auth, adminOnly, async (req, res) =>
    res.json({ services: (await store.read()).services }),
  );
  function serviceInput(body) {
    const name = text(body.name, 80),
      category = text(body.category, 50),
      description = text(body.description, 300),
      duration = Number(body.duration),
      price = Number(body.price);
    if (
      name.length < 3 ||
      category.length < 2 ||
      description.length < 10 ||
      !Number.isInteger(duration) ||
      duration < 15 ||
      duration > 180 ||
      duration % 15 ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 10000
    )
      fail(
        400,
        "Add a name, category, description, duration (15–180, multiples of 15), and price ($0–10,000).",
      );
    return {
      name,
      category,
      description,
      duration,
      price: Math.round(price * 100) / 100,
      icon: "scissors",
      active: body.active !== false,
    };
  }
  app.post("/api/admin/services", auth, adminOnly, async (req, res) => {
    const input = serviceInput(req.body);
    const service = await store.mutate((s) => {
      const row = { id: id(), ...input };
      s.services.push(row);
      return row;
    });
    res.status(201).json({ service });
  });
  app.patch(
    "/api/admin/services/:serviceId",
    auth,
    adminOnly,
    async (req, res) => {
      const input = serviceInput(req.body);
      const service = await store.mutate((s) => {
        const row = s.services.find((x) => x.id === req.params.serviceId);
        if (!row) fail(404, "Service not found.");
        Object.assign(row, input);
        return row;
      });
      res.json({ service });
    },
  );
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((error, req, res, next) => {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ error: "This time slot or account is no longer available." });
    const status = error.status || 400;
    res
      .status(status >= 400 && status <= 599 ? status : 500)
      .json({
        error:
          status === 500
            ? "Something went wrong. Please try again."
            : error.message || "Request failed.",
      });
  });
  return app;
}
