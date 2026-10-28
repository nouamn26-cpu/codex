# BookEase — MERN Appointment Booking

A working salon appointment booking portfolio demo with a calm mint/cream visual design, an original SVG studio illustration, customer/staff/admin workflows, and persistent backend data. This is an editable source project, not just a UI mockup.

## Jaldi start karein — VS Code + Windows

1. Node.js **24 LTS** aur VS Code install karein. Node 22.12+ supported hai; verification Node 24 par hui.
2. Archive extract karke **02-bookease** folder VS Code mein open karein.
3. VS Code terminal mein:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

4. Browser mein **http://localhost:4102** kholein.
5. Server stop karne ke liye terminal mein `Ctrl+C` karein.

macOS/Linux par `.env` copy command `cp .env.example .env` hai. `.env` optional hai: development defaults se demo chal jata hai. Pehli baar MongoDB ki zaroorat nahi: local data `.data/bookease.json` mein persist hota hai.

Port busy ho to `npm run dev -- --port 5102` use karein. `PORT=5102` `.env` mein bhi set kar sakte hain. React/CSS edits Vite HMR se refresh hote hain; server files ya `.env` badalne ke baad server manually restart karein. VS Code ka static Live Server extension akela Express backend nahi chala sakta.

## Demo logins

| Role        | Email                  | Password | Access                                                  |
| ----------- | ---------------------- | -------- | ------------------------------------------------------- |
| Guest       | customer@bookease.demo | Demo123! | Book and manage own appointments                        |
| Team member | staff@bookease.demo    | Demo123! | Mila's appointment schedule and notifications           |
| Admin       | admin@bookease.demo    | Demo123! | All appointments, catalog management, all notifications |

Sign-in dialog mein one-click demo buttons bhi hain. Registration hamesha **customer** account banata hai; client role field se admin access nahi mil sakta. These are fictional portfolio accounts, not real customers.

## Working features

- Service cards with category filtering, durations and server-authoritative USD demo prices.
- Three staff profiles; date/time availability based on each service's duration.
- Booking, rescheduling, cancellation and completed-appointment history.
- **No overlapping appointments:** 45-minute bookings block every covered 15-minute interval. Adjacent intervals remain bookable.
- Opening hours **10:00–19:00 daily**; booking horizon today through 180 days. Same-day slots must be at least one minute in the future.
- All appointment dates/times use **Asia/Karachi (PKT / UTC+05:00)**, regardless of the visitor's computer timezone.
- Admin creates/edits/pauses services. Existing appointment prices/durations are snapshots; catalog edits do not rewrite history.
- Customer ownership and assigned-staff authorization enforced on the server. Admin has global access.
- Staff/admin can mark an appointment completed **after its scheduled end**. Future appointments can be rescheduled/cancelled; past records remain history.
- Confirmation, reschedule, cancellation and reminder outbox records.
- On-demand reminder creation for appointments in the next 24 hours; repeated runs do not duplicate the same reminder.
- Seeded fictional upcoming/completed visits so the dashboard can be explored immediately.
- Password hashing with bcrypt, expiring JWT sessions, request size limits, basic rate limits and Helmet headers.

## Commands

```text
npm run dev     Express + Vite development server, one origin/port
npm run build   Compile React into client/dist
npm start       Express serves the built UI and /api
npm test        Run 12 meaningful API/persistence integration tests
```

For a local production-style build, run `npm run build`, then `npm start`. Leave `NODE_ENV=development` for local file mode. Explicit production mode requires MongoDB and a strong JWT secret.

## MongoDB / MERN mode

Set `MONGODB_URI` in `.env` to use a MongoDB Atlas database instead of the JSON file:

```dotenv
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/bookease?retryWrites=true&w=majority
```

Use a different database name for each portfolio app. The backend fails with a useful startup error if MongoDB cannot connect; it does not silently fall back and lose production data. URI passwords containing special characters must be URL encoded.

MongoDB mode uses Mongoose models/collections for `users`, `services`, `staff`, `bookings`, `outbox`, `reservations`, and `meta`. Booking mutations run in replica-set transactions. A metadata revision write serializes availability checks across API processes, and a unique compound `(staffId, date, minute)` index prevents conflicting 15-minute reservations. Rescheduling/cancellation change reservations in the same transaction.

**Transactions need a replica set:** Atlas supports this. A standalone local `mongod` is not suitable without configuring a replica set. The local JSON adapter uses serialized mutations and atomic rename; it is for a single local Node process only.

The adapter currently reads the small demo dataset within each mutation and rebuilds reservation rows. This keeps the sample easy to follow; a high-volume product should use targeted collection queries/reservation changes and retention/pagination rather than treating this implementation as a large-scale scheduling system.

## Notifications: exactly what works

Without SMTP variables, notifications are saved with status **demo** to the real in-app outbox. No outside email is sent, and the UI says so.

Optional SMTP is implemented through Nodemailer. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`; restart the server. Messages are recorded as `pending`, then `sent` or `failed`. `sent` means the SMTP server accepted the message, not guaranteed inbox delivery. Delivery credentials and real mailbox delivery were not verified in this build.

**Render Free blocks outbound SMTP ports 25, 465 and 587.** Keep demo outbox on Render Free; real email there needs an HTTP email provider integration (not included). SMTP can be used locally or on a hosting plan/network that allows it.

Reminders are created by the staff/admin **Create next-24h reminders** button. No automatic cron service is included. For automatic reminders, add an authenticated external scheduler and a reliable worker; don't claim the current manual action is automatic.

Payment is **pay at the studio**. This project does not collect cards or implement Stripe; booking and cancellation are fully functional without a payment provider.

## Free live demo — Render + MongoDB Atlas

See the pack's `FREE-HOSTING.md` for a full guide. This project includes `render.yaml`:

1. Put this project into your own GitHub repository (or choose its subfolder as the Render Root Directory).
2. Create a MongoDB Atlas Free cluster/database user and allow the hosting service's outbound network addresses.
3. Create a Render **Web Service**, choose **Free**, and set:

```text
Build command: npm ci --include=dev && npm run build
Start command: npm start
NODE_ENV: production
NODE_VERSION: 24
JWT_SECRET: a unique random secret at least 32 characters
MONGODB_URI: your Atlas connection URI with /bookease database
SEED_DEMO: true
```

The included Blueprint generates the JWT secret. Render supplies `PORT`; the server honors it. Keep demo accounts enabled only for a portfolio sandbox with fictional data. Free plans have sleep/usage limits; the shared hosting guide links current official limits.

A new non-demo database can use `SEED_DEMO=false`, `ADMIN_EMAIL`, and an `ADMIN_PASSWORD` of at least 12 characters to bootstrap the administrator alongside the catalog. **Use a fresh database**: changing `SEED_DEMO` does not delete demo accounts already stored. Set a unique random JWT secret; `.env.example`'s placeholder is rejected in production. Never commit `.env` or put real customer data into this public demo.

Localhost is only on your own computer. Publishing on Render gives you a public HTTPS address; the archive by itself is not an already deployed website.

## Source map

- `client/src/main.jsx` — React screens, accessible dialogs, booking flow, dashboards.
- `client/src/styles.css` — responsive visual system; original inline SVG visuals are in React.
- `server/app.js` — authenticated REST API, service administration and notifications.
- `server/domain.js` — dates, duration overlap validation and fictional seed data.
- `server/store.js` — atomic JSON adapter and transactional Mongoose adapter.
- `server/index.js` — environment, server startup, dev middleware and built frontend serving.
- `tests/workflow.test.js` — API authorization, concurrent overlap, reschedule/cancel, reminders and persistence.
- `BUILD_PROMPT.md` — ready-to-use Codex build brief.

## Verification and limits

`npm run build` and all **12 tests pass** on Node 24. A separate reviewer also exercised MongoDB replica-set behavior with two independent API/store instances: a same-slot race resulted in one success and one conflict, service/user mutations after reservations worked, reschedule/cancel worked, and records survived reopening the database.

Tests for MongoDB require a running replica set and are not part of the default no-database test command. SMTP delivery and the user's hosting accounts were not tested. Public registration has basic abuse limits, but features such as password reset/email verification, holiday schedules, staff shifts, refunds, automatic reminders, staff provisioning and production operations are deliberate future work. This is a functional portfolio MVP, not a claim of a completed commercial salon platform.

Package source excludes `node_modules`, private `.env`, `.data`, and runtime databases. Run `npm install` after extracting.
