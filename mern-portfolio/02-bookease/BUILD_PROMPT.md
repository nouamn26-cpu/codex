# Codex build prompt — BookEase

Build an editable, runnable MERN appointment-booking portfolio project named **BookEase** for a small salon in Lahore. Complete the code and verify the core workflows. Do not stop at a design mockup or a project plan.

## Product and visual direction

Use a thoughtful mint/forest/cream visual identity: small sans-serif labels, large Georgia editorial headings, warm whitespace, subtle borders and calm illustrations. Build original code-native SVG salon and staff visuals so there are no external image dependencies. Include a responsive service storefront, category filters, studio/team section, clear booking actions and a polished modal flow. Mobile should be fully usable. Use accessible labels, visible keyboard focus, dialog focus containment, Escape dismissal, loading, empty, error and success states.

## Stack and project structure

- React + Vite frontend, Express + Node backend, MongoDB via Mongoose.
- One root `package.json` and lockfile. `npm install`, `npm run dev`, `npm run build`, `npm start`, `npm test` must work from the project folder.
- Development uses Vite middleware on the Express origin. `npm run dev -- --port 5102` should work; honor environment `PORT` and default to 4102. Do not use Node watch mode around Vite timestamped config imports.
- Production serves `client/dist` and `/api` on one origin; include Render configuration and environment examples. Require a strong JWT secret and Mongo URI in explicit production mode.
- Supply a persistent local JSON adapter for instant setup without Atlas. Store local data under ignored `.data/`; serialize mutations and write atomically. Make clear this is demo mode for one process.
- Mongo mode must have real collections, atomic transaction boundaries and a unique compound index for staff/date/15-minute interval reservations. Two separate API processes must not be able to double book a slot. Use an Atlas/replica-set-capable implementation.

## Features

1. Public catalog with categories, descriptions, duration and server-authoritative price. Seed six fictional salon/grooming/wellness services and three professionals.
2. Register/login with bcrypt password hashing and expiring signed JWTs. Registration always creates a customer; don't accept a role override. Demo customer/staff/admin accounts only when explicitly enabled or in development. Also support bootstrapping an admin into a fresh non-demo database.
3. Server-generated availability. All booking dates/times interpreted in **Asia/Karachi**. Open daily 10:00–19:00; 15-minute start increments, duration-aware end boundaries and overlap checks, one-minute future buffer, 180-day booking horizon. Reject malformed/invalid/past dates and arbitrary unavailable times.
4. Customers can book and view their appointments. Staff see only their assigned appointments. Admin sees all. Enforce ownership on reads and mutations, not just visible buttons.
5. Reschedule with server conflict validation and atomic release/reservation. Cancel future confirmed bookings and release their time. Only assigned staff/admin can mark an elapsed appointment completed; reject future completion. Historical service price/duration must not be silently rewritten after catalog edits.
6. Admin can add/edit/pause services with validation. Paused services are hidden from new booking choices.
7. Persist confirmation/reschedule/cancellation/reminder notifications. If SMTP is unset, display **demo — not sent** outbox records. Optionally implement actual SMTP and log accepted/failed status honestly. Never claim an outside email was sent without provider acceptance.
8. Staff/admin can create reminders for confirmed appointments in the next 24 hours. Repeated runs must be idempotent for the same appointment/date/time. Label the action on demand; no automatic cron claim.
9. Pay at the studio; no card collection. Do not add fake payment buttons.
10. Include a useful customer dashboard, team schedule, admin service editor, outbox, demo login choices and fictional upcoming/completed appointments.

## Deliverables

Include all editable source, a `.env.example`, `.gitignore`, `render.yaml`, Windows/VS Code README, source map, API implementation notes and this build prompt. Exclude private environment files, databases, `node_modules` and runtime data from the distributable. The README must explain local vs Mongo mode, exact demo logins, free hosting steps, timezone and true integration limits.

Render Free blocks SMTP ports 25/465/587; document that real email there needs an HTTP email provider integration. Use `npm ci --include=dev && npm run build` because the build needs Vite even when `NODE_ENV=production`; start with `npm start` and Node 24. No hosting credentials or actual deployment are assumed.

## Acceptance tests

Run build plus meaningful integration tests: private endpoints/auth, no role escalation, customer/staff ownership, server-authoritative prices, overlapping durations, concurrent reservation race, adjacent slots, conflicting reschedule, released old/cancelled slots, invalid/out-of-range dates and off-grid times, future completion rejection, elapsed assigned-team completion, idempotent reminders, honest demo outbox, admin catalog changes and file persistence after reopen. Where a Mongo replica set is available, repeat the race using two independent adapters/API instances and check persisted state after reconnect. State precisely what was and wasn't verified.

Deliver a working portfolio MVP with honest limitations. Do not call it production-ready without the necessary operational work, and do not misrepresent personal demo data as real client results.
