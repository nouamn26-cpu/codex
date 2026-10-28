# ServiceHub — MERN tutoring marketplace

A personal portfolio MVP for finding tutors, requesting lessons, coordinating in private messages, confirming completion, leaving reviews, and moderating the directory. The customer/provider/admin workflow is functional end to end. Sample people, experience claims, and reviews are fictional demo content.

## Quick start · Windows / VS Code

Install **Node.js 24 LTS**. Extract the archive first, then open this **05-servicehub folder** in VS Code. Open **Terminal → New Terminal** and run:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:4105**. On macOS/Linux, replace `Copy-Item .env.example .env` with `cp .env.example .env`. This app uses **one HTTP server** for the Express API and Vite middleware, so a second frontend terminal is unnecessary. `PORT` can be changed in `.env` if needed. Stop with Ctrl+C.

Frontend edits reload through Vite. After editing backend files, stop and restart `npm run dev`. You may also select a port with `npm run dev -- --port 4205`; the command-line port takes precedence over `.env`. Without a configured `JWT_SECRET`, development generates a temporary secret, so restarting signs out previous sessions.

Roman Urdu: archive extract karo, VS Code mein `05-servicehub` folder kholo, upar wali commands chalao, phir browser mein `http://localhost:4105` kholo. Sirf VS Code Live Server extension se backend nahi chalega; `npm run dev` use karo.

With no `MONGODB_URI`, local data is saved atomically to `.data/servicehub.json`. This directory is intentionally absent from the download. The first run creates seeded demo records; subsequent restarts keep your changes. To reset the local demo, stop the server, delete only this project's `.data` folder, then restart. **This deletes your local demo data.**

## Try all three roles

The sign-in dialog has quick demo buttons. These work when `SEED_DEMO=true` and the database was initially created with demo seed data.

| Role    | Email                     | Password       |
| ------- | ------------------------- | -------------- |
| Student | `student@servicehub.demo` | `DemoPass123!` |
| Tutor   | `tutor@servicehub.demo`   | `DemoPass123!` |
| Admin   | `admin@servicehub.demo`   | `DemoPass123!` |

These are intentionally public demonstration credentials. Do not use them or put personal information in a real customer deployment. Changing `SEED_DEMO=false` does not delete previously seeded accounts; use a fresh Mongo database for a clean installation.

Suggested walkthrough:

1. Sign in as a student. Filter tutors, open Aisha's profile, request a future Mathematics session, then send a message in My sessions.
2. Sign out and sign in as a tutor. Accept the request and reply in Messages.
3. Tutor clicks **Request completion**. Student signs in and clicks **Confirm completed**, then leaves a review.
4. Sign in as admin. Unpublish or republish a listing, suspend/restore a member, and resolve reports submitted from tutor profiles.

Session states are `requested → accepted → completion_requested → completed`; the provider can decline a request and the student can cancel a requested/accepted session. A provider cannot accept sessions whose one-hour windows overlap with another accepted/completion-requested session. Both parties attest completion; the demo does not verify attendance.

## Commands

| Command                | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Express plus Vite in one local development server        |
| `npm run build`        | Compile React into `client/dist`                         |
| `npm start`            | Express serves the compiled React app and API            |
| `npm test`             | API integration and file-persistence tests               |
| `npm run create-admin` | One-time admin bootstrap from private environment values |

For a local compiled preview, run `npm run build` followed by `npm start`. Do not set `NODE_ENV=production` until you configure MongoDB and a strong JWT secret.

## Real MongoDB mode

Set this in your private `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/servicehub
JWT_SECRET=replace-with-a-unique-random-secret-at-least-32-characters
SEED_DEMO=true
```

Or use the MongoDB Atlas driver connection string, with a unique database name such as `/servicehub`. Replace credentials locally, URL-encode special characters in the database password, allow your app host's outbound IP addresses in Atlas network access, and never commit `.env`. Restart after changes. `/api/health` reports `storage: mongodb` once connected. A configured Mongo connection failure stops startup; it does not silently fall back to file mode.

The Mongoose adapter stores one bounded `servicehub_state` document and uses an optimistic revision compare-and-swap plus local serialization to avoid silently losing concurrent updates. It is intentionally simple for a portfolio MVP. MongoDB's 16 MiB document limit applies: move users, sessions, messages, and reviews to indexed separate collections before scaling beyond a small demo. File mode supports one server process only.

## Free public hosting · Render + MongoDB Atlas

`localhost` is visible on your own machine; it is not a public portfolio URL. This project includes a `render.yaml` Blueprint. Upload just this project to a Git repository, then connect it to a Render **Web Service**, choosing the **Free** instance if available for your account. For a combined repository, set the service Root Directory to `05-servicehub` (or your actual nested path).

- **Build:** `npm ci --include=dev && npm run build`
- **Start:** `npm start`
- **Health check:** `/api/health`
- **Node version:** `24`
- **Environment:** `NODE_ENV=production`, `MONGODB_URI=<Atlas connection string>`, `JWT_SECRET=<unique generated secret of 32+ characters>`, and `SEED_DEMO=true` for a public demo.

Use the Atlas **Free cluster** tier, its database user, and a database name unique to this app. For persistent hosted operation, MongoDB is mandatory; the server rejects file mode in production because free host filesystems can reset. Render supplies `PORT`; no fixed public port configuration is needed. The frontend and API share one origin, so no CORS setup or separate frontend hosting is required.

Free services have quotas and may sleep when idle. Current plan eligibility/limits must be checked in your account; this package does not create accounts or deploy anything. Primary references: [Render free services](https://render.com/docs/free), [Deploy Node Express](https://render.com/docs/deploy-node-express-app), [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

For a non-demo installation, use a fresh database and `SEED_DEMO=false`. Create one administrator by temporarily setting `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12–128 characters), and optional `ADMIN_NAME` in the private environment for the same database, then run `npm run create-admin`. Remove `ADMIN_PASSWORD` afterward. Public registration only creates students or tutors.

## What works

- Registration/sign-in, bcrypt password hashes, eight-hour signed JWTs, roles loaded from the database on every authenticated request, and account suspension invalidates existing tokens.
- Tutor profile editing; subject, query, budget filters; price/rating sorting; public reviews.
- Server-authoritative tutor/subject/price, future time checks, lifecycle transitions, acceptance overlap checks, and ownership-scoped requests.
- Participant-only messages with five-second polling; React safely renders plain text.
- One review per completed session by its student; reports and admin listing/account moderation.
- Local file persistence and selectable real MongoDB persistence; demo admin bootstrap.
- Responsive original UI with CSS/inline SVG. Google Fonts is optional; system fonts work when offline.

## Deliberate limits

No real payments, video conferencing, email notifications, password-reset delivery, socket realtime messaging, identity verification, or independent certification checks. Tutors coordinate meeting links in messages using their own tools. Dates are entered and displayed in the browser's timezone and stored as UTC ISO timestamps. Prices are USD demo quotes. Profiles and teaching experience are self-reported. There is no recurring timetable/calendar sync, reminder worker, or dispute/escrow system. Completion is a mutual assertion.

This is a demo MVP, not a production-security certification. JWTs are stored in browser localStorage; use HTTPS for public demos and consider HttpOnly cookie sessions, CSP, email verification, monitoring, per-resource rate limits, and indexed per-collection models before serving real users.

## Tests and verification

`npm test` runs real HTTP API requests with the built-in Node test runner against an isolated in-memory adapter. It checks booking totals/ownership, private messaging, allowed transitions, completion/review restrictions, duplicate reviews, concurrent overlap acceptance, public-role escalation rejection, moderation, filters, profile validation, and atomic file persistence across restart. Tests never modify the demo data folder.

`npm run build` validates that the React application compiles. These local checks do not exercise a real Atlas connection or a deployed Render service; configure those in your own accounts and verify `/api/health` afterward.

Source map: `client/src/main.jsx` and `style.css` contain the interface; `server/app.js` is the API; `server/store.js` contains file/Mongoose persistence and demo seed; `server/index.js` is the entry point; `tests/marketplace.test.js` contains business-flow tests. `BUILD_PROMPT.md` is the reusable Codex build brief.
