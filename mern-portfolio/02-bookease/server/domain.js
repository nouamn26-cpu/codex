import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
export const ZONE = "Asia/Karachi";
export const id = () => randomUUID();
export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export const publicUser = ({ passwordHash, ...user }) => user;
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(new Date());
export function dateTime(date, time) {
  return new Date(`${date}T${time}:00+05:00`);
}
export function minute(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function clock(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
export function validDate(date) {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(dateTime(date, "12:00").getTime()) ||
    dateTime(date, "12:00").toISOString().slice(0, 10) !== date
  )
    fail(400, "Choose a valid date.");
  const days =
    (dateTime(date, "12:00") - dateTime(today(), "12:00")) / 86400000;
  if (days < 0 || days > 180)
    fail(400, "Bookings are available from today through the next 180 days.");
}
export function getService(state, serviceId) {
  const s = state.services.find((s) => s.id === serviceId && s.active);
  if (!s) fail(404, "This service is unavailable.");
  return s;
}
export function getStaff(state, staffId) {
  const s = state.staff.find((s) => s.id === staffId);
  if (!s) fail(404, "Choose a valid professional.");
  return s;
}
export function available(state, staffId, date, time, duration, exceptId) {
  const start = minute(time),
    end = start + duration;
  return !state.bookings.some(
    (b) =>
      b.id !== exceptId &&
      b.status === "confirmed" &&
      b.staffId === staffId &&
      b.date === date &&
      start < minute(b.time) + b.duration &&
      end > minute(b.time),
  );
}
export function slots(state, { serviceId, staffId, date, exceptId }) {
  validDate(date);
  const service = getService(state, serviceId);
  getStaff(state, staffId);
  const list = [];
  for (let start = 600; start + service.duration <= 1140; start += 15) {
    const time = clock(start);
    if (
      dateTime(date, time).getTime() > Date.now() + 60000 &&
      available(state, staffId, date, time, service.duration, exceptId)
    )
      list.push(time);
  }
  return list;
}
export function validateSlot(state, body, exceptId) {
  const service = getService(state, body.serviceId);
  const staff = getStaff(state, body.staffId);
  validDate(body.date);
  if (
    typeof body.time !== "string" ||
    !/^\d{2}:\d{2}$/.test(body.time) ||
    !slots(state, { ...body, exceptId }).includes(body.time)
  )
    fail(409, "That appointment is no longer available. Choose another time.");
  return { service, staff };
}
export function notification(state, booking, kind, smtpEnabled) {
  const user = state.users.find((u) => u.id === booking.userId);
  const subject = {
    booked: "Your BookEase appointment is confirmed",
    rescheduled: "Your appointment has been rescheduled",
    cancelled: "Your appointment was cancelled",
    reminder: "Your BookEase appointment is coming up",
  }[kind];
  const item = {
    id: id(),
    bookingId: booking.id,
    userId: user.id,
    kind,
    to: user.email,
    subject,
    text: `Hello ${user.name},\n\n${booking.serviceName} with ${booking.staffName}\n${booking.date} at ${booking.time} (${ZONE})\nStatus: ${booking.status}\n\nBookEase portfolio demo`,
    status: smtpEnabled ? "pending" : "demo",
    createdAt: new Date().toISOString(),
    error: "",
  };
  state.outbox.unshift(item);
  return item;
}
export async function seed(
  store,
  { demo = true, adminEmail, adminPassword } = {},
) {
  const passwordHash = demo ? await bcrypt.hash("Demo123!", 12) : null;
  if (!demo && adminEmail && (!adminPassword || adminPassword.length < 12))
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  const adminHash =
    !demo && adminEmail ? await bcrypt.hash(adminPassword, 12) : null;
  await store.mutate((state) => {
    if (state.services.length) return false;
    state.users = demo
      ? [
          {
            id: "demo-customer",
            name: "Alex Morgan",
            email: "customer@bookease.demo",
            passwordHash,
            role: "customer",
          },
          {
            id: "demo-admin",
            name: "Jamie Harper",
            email: "admin@bookease.demo",
            passwordHash,
            role: "admin",
          },
          {
            id: "demo-staff",
            name: "Mila Taylor",
            email: "staff@bookease.demo",
            passwordHash,
            role: "staff",
          },
        ]
      : adminHash
        ? [
            {
              id: id(),
              name: "Studio administrator",
              email: adminEmail.trim().toLowerCase(),
              passwordHash: adminHash,
              role: "admin",
            },
          ]
        : [];
    state.staff = [
      {
        id: "mila",
        userId: demo ? "demo-staff" : null,
        name: "Mila Taylor",
        title: "Hair & styling specialist",
        initials: "MT",
        color: "#d9e7de",
      },
      {
        id: "noah",
        userId: null,
        name: "Noah Brooks",
        title: "Grooming specialist",
        initials: "NB",
        color: "#f0dfc8",
      },
      {
        id: "ava",
        userId: null,
        name: "Ava Chen",
        title: "Skin & wellness specialist",
        initials: "AC",
        color: "#e8dfec",
      },
    ];
    state.services = [
      {
        id: "signature-cut",
        name: "The signature cut",
        category: "Hair & styling",
        duration: 45,
        price: 45,
        description:
          "A considered cut, consultation, wash and finish. A fresh perspective, tailored to you.",
        icon: "scissors",
        active: true,
      },
      {
        id: "blow-dry",
        name: "Wash & blow-dry",
        category: "Hair & styling",
        duration: 30,
        price: 30,
        description:
          "From soft movement to sleek polish. Leave with a little extra confidence.",
        icon: "wind",
        active: true,
      },
      {
        id: "beard-sculpt",
        name: "Beard & detail",
        category: "Grooming",
        duration: 30,
        price: 25,
        description:
          "Precision shaping, a warm towel and those finishing touches that make a difference.",
        icon: "razor",
        active: true,
      },
      {
        id: "skin-reset",
        name: "The skin reset",
        category: "Skin & wellness",
        duration: 60,
        price: 65,
        description:
          "A restorative cleanse, gentle treatment and deep hydration for a brighter day.",
        icon: "sparkles",
        active: true,
      },
      {
        id: "colour-refresh",
        name: "Colour refresh",
        category: "Hair & styling",
        duration: 90,
        price: 95,
        description:
          "Rich tones and thoughtful dimension, with a personal colour consultation.",
        icon: "palette",
        active: true,
      },
      {
        id: "head-massage",
        name: "Head in the clouds",
        category: "Skin & wellness",
        duration: 30,
        price: 35,
        description:
          "Slow down with a deeply relaxing scalp, neck and shoulder massage.",
        icon: "leaf",
        active: true,
      },
    ];
    if (demo) {
      const tomorrow = new Date(`${today()}T12:00:00+05:00`);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const yesterday = new Date(`${today()}T12:00:00+05:00`);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const upcoming = {
        id: id(),
        userId: "demo-customer",
        serviceId: "signature-cut",
        staffId: "mila",
        date: tomorrow.toISOString().slice(0, 10),
        time: "11:00",
        duration: 45,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        serviceName: "The signature cut",
        staffName: "Mila Taylor",
        price: 45,
        notes: "A small refresh, please.",
      };
      state.bookings.push(upcoming, {
        id: id(),
        userId: "demo-customer",
        serviceId: "head-massage",
        staffId: "ava",
        date: yesterday.toISOString().slice(0, 10),
        time: "13:00",
        duration: 30,
        status: "completed",
        createdAt: yesterday.toISOString(),
        serviceName: "Head in the clouds",
        staffName: "Ava Chen",
        price: 35,
        notes: "",
      });
      notification(state, upcoming, "booked", false);
    }
    return true;
  });
}
