# Codex Build Prompts — Five MERN Portfolio Projects

Har prompt ko Codex agent mein paste karein. Existing folder open ho to pehle code inspect karne, phir requested changes apply karne ko kahein. Yeh prompts English mein hain taa-ke technical requirements clear rahein.

Completed editable implementation har named folder mein included hai. Development credentials sample-only hain; external-service secrets kabhi prompt/source mein include na karein.

---

## 1. ShopFlow

Project folder: `01-shopflow`

# Codex build prompt — ShopFlow

Paste the prompt below into a coding agent after opening an empty project folder. It describes the implemented portfolio MVP. External integrations are a separate extension and must never be claimed as working unless configured and tested.

---

Build **ShopFlow**, a complete personal MERN portfolio demo for a fictional premium desk/computer-accessories shop. Deliver editable source that opens in VS Code, runs locally without paid accounts, and can be deployed as one Node web service with MongoDB Atlas Free.

## Technology and runnable setup

- React frontend, Node.js + Express API, Mongoose models for MongoDB.
- Single root package.json and npm lockfile; Node 22.12+ / 24 LTS.
- Commands: npm ci, npm run dev, npm run build, npm start, npm test.
- Use Vite middleware on the Express development server so frontend and API share one origin and one port. Serve the built frontend from Express for hosting.
- Default port 4101; honor PORT and optional CLI --port. Frontend calls same-origin /api.
- Frontend hot reload is supported; backend changes can require a manual restart.
- Provide .env.example, .gitignore, README setup for Windows/VS Code, and a Render Free blueprint. Do not include node_modules, build artifacts, real secrets or populated runtime data in the source archive.
- Default local storage is an atomic JSON file in ignored .data/. A MONGODB_URI switches to the actual MongoDB adapter; never silently fall back after an invalid URI.
- MongoDB uses typed User/Product/Order models and transaction-protected inventory. Transactions must use sequential awaited operations, not Promise.all on a shared session. Explain Atlas/local replica-set requirements.
- In NODE_ENV=production require MongoDB and JWT_SECRET of at least 32 characters. Do not rely on an ephemeral hosted JSON filesystem.

## Visual direction

Use an original warm, airy workspace store design: ivory background, graphite typography, sage surfaces and restrained burnt-orange accents. Create an editorial hero with a desk scene and a large headline: “Make room for better work.” Pair clear sans-serif interface copy with a little serif display type.

Create original local SVG illustrations of a mechanical keyboard, desk lamp, headphones, laptop stand, mouse, speaker, desk mat and USB-C hub. Do not depend on remote image URLs, paid assets or external font loading. Avoid fabricated review counts, customer metrics and client logos.

Include a top announcement bar, clear navigation, sign-in and shopping-bag controls; hero CTA; three concise benefits; category tabs; search, maximum-price filter and sort; responsive product cards; a small story strip; and a functional informational footer. Every visible button must act, open real contextual information, or clearly be disabled.

Use responsive layouts for desktop and mobile, clear focus styles, labeled form controls, reduced-motion support, keyboard-friendly modals and focus trapping.

## Storefront and customer workflow

1. Seed eight fictional workspace products with USD prices, descriptions, badges, visual type, background color, active state and variant-level stock.
2. Search by product text, filter categories, adjust a maximum-price slider and sort by featured, price or name.
3. Open a product detail modal with its illustration, price, description, finish options, stock availability, quantity picker and Add to bag action.
4. Store the bag in localStorage, scoped to the browser. Support quantity changes/removal, subtotal and free-demo-shipping progress. Cap each variant at 10 per order.
5. Offer customer registration and sign-in, with bcrypt-hashed passwords and expiring JWT sessions. Registration must always create a customer regardless of any client-supplied role.
6. Before checkout require authentication. Collect fictional delivery details and clearly label the flow as a **simulated checkout**. Never ask for a real card.
7. Calculate prices, totals, shipping and stock exclusively on the server. Ignore all client-submitted price, total, role, owner or payment-status fields. Standard demo shipping is $7.50, free at $150.
8. Aggregate duplicate variant lines before checking quantity/stock to prevent bypasses. A successful checkout reserves stock and records an order atomically.
9. Accept a per-checkout idempotency key. Replaying it for the same user must return the existing order and must not decrement stock again.
10. Persist customer-owned order history. Customers can only see their own orders; guessing another order ID cannot grant cancellation or access.
11. A placed order can be cancelled by its owner. Restore reserved stock exactly once. Processing/shipped/delivered restrictions must be enforced server-side.

## Admin workflow

- Seed explicit public demo accounts only in development or with SEED_DEMO=true:
  - customer@shopflow.demo / Demo12345!
  - admin@shopflow.demo / Demo12345!
- Make the sign-in dialog's sample-account buttons fill the fields; users still submit the form.
- Protect every admin API with authentication and role checks.
- Show actual active-product counts, open orders, simulated order value and low-stock variants; do not invent business activity.
- Add/edit products with validated name, description, category, integer price in cents, local illustration type, background hex color, badge, active state and variant stock.
- Archive products by hiding them from the storefront; archived products cannot be bought.
- List orders with item snapshots, fictional delivery details, server totals and status.
- Allow legal transitions placed → processing → shipped → delivered. Allow cancellation only from placed or processing. Restore stock on cancellation and reject invalid state transitions.

## Validation, reliability and documentation

- Validate strings, email, password lengths, integer quantities, price, variant IDs and stock. Limit request sizes; rate-limit authentication and API usage; use security headers.
- Keep passwords and signing secrets out of API responses, source and logs.
- Use structured JSON error messages. Handle loading, empty, validation and server-error states in the UI.
- Do not delete or overwrite real external data. Keep all fixtures fictional.
- Write meaningful integration tests for privilege escalation, object ownership, tampered prices, idempotency, parallel final-unit checkout, duplicate-line quantity bypasses, cancellation restocking, legal fulfillment transitions and persistence.
- Include a guide explaining localhost versus a public URL, MongoDB configuration and free-plan quotas/cold starts.
- For Render use npm ci --include=dev && npm run build, then npm start. Use NODE_ENV=production, NODE_VERSION=24, MONGODB_URI, JWT_SECRET and an explicit SEED_DEMO choice. Select the free instance explicitly.
- State exactly which tests were run, what the app actually implements, and what still needs credentials or external services.

Deliver a polished, working portfolio MVP. Do not describe it as a real client project or a production-certified store.

## Optional next phase — only after the MVP works

If explicitly requested, add Stripe **test-mode** Checkout. Keep authoritative prices on the server, verify the signed webhook using the raw request body, persist provider event IDs to make webhooks idempotent, and reserve/release inventory around successful, expired and cancelled checkout sessions. Never mark an order paid based only on a browser redirect. Document that live payments require an eligible payment-provider account, credentials, deployment and a separate operational review.

Other separate extensions: transactional email, password reset, product-image upload, database pagination, taxes, shipping provider API, refunds, audit logs and accessibility testing.

---

---

## 2. BookEase

Project folder: `02-bookease`

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

---

## 3. ClientDesk

Project folder: `03-clientdesk`

# Codex build prompt — ClientDesk CRM

Copy the following prompt into a coding agent. The current directory contains the finished MVP; ask the agent to inspect it before changing anything.

---

Build or improve **ClientDesk**, an original agency CRM portfolio application using **MongoDB, Express, React and Node.js**. Make it a coherent working application with real backend persistence, not a dashboard mockup. Keep the source understandable for a MERN learner and runnable from one folder in VS Code.

## Product and visual direction

Create a calm, polished light dashboard with indigo navigation accents, muted colored labels, readable typography, roomy cards, a fixed desktop sidebar and an accessible mobile menu. Create original CSS/SVG assets. Use flexible layouts, accessible form labels, clear loading/error/empty states, keyboard-friendly controls and real data for all authenticated statistics. Clearly label this as a Personal Demo Project. Do not invent customer outcomes or fake growth percentages.

Pages: sign in/create workspace/join team; overview dashboard; sales pipeline; clients; tasks; notes; team/invites; workspace settings.

## Functional requirements

1. Hash passwords with bcrypt. Sign short-lived JWTs, verify algorithm/issuer/expiry, then reload the user from storage for authorization. Ignore client-supplied roles, ownership and workspace IDs. Require a strong JWT secret in production.
2. Every private record must belong to a workspace. Scope every query/mutation/export to the authenticated user's workspace. A guessed foreign ID must return 404. Use separate accounts in two demo workspaces to demonstrate this.
3. Leads: create/edit/delete, name, company, valid email, nonnegative USD value, source, stage. Stages: New, Contacted, Proposal, Won, Lost. Offer a Kanban board with drag-and-drop and equivalent stage select controls. Both admins and members can manage leads; only admins can delete.
4. Clients: searchable list, company/contact/email/industry/status, create/edit/delete for admins, read-only members. Statuses Active, Paused, Archived.
5. Tasks: title, validated real date, priority, status, workspace-local assignee. Admins can assign/edit any local task. Members can create only tasks assigned to themselves and edit/complete/delete only their own tasks.
6. Notes: author and workspace come from the session. Author or admin can delete. Render text safely without HTML injection.
7. Team: list only this workspace. Admin creates cryptographically random single-use member invitation codes. Store only hashes; expire them after seven days; permit revocation. Consume invitations atomically to prevent reuse. Show the raw code once and explain manual sharing; do not claim email delivery without a real provider.
8. Dashboard: open pipeline sum excludes Won/Lost, won value is labeled as lead revenue rather than verified payments, active client count, open tasks, pipeline stage chart, upcoming tasks, recent leads. No fabricated monthly history.
9. Export workspace-scoped CSV; escape quotes and neutralize formula-like cell prefixes.
10. Validate all input server-side, use a small JSON payload limit and auth rate limits, keep secrets server-side, handle failure states and API 404s properly.

## Architecture and developer experience

- One root `package.json`; `npm install`, `npm run dev`, `npm run build`, `npm start`, `npm test`.
- React frontend in `client`; Express backend in `server`; Mongoose models/indexes per collection.
- Express + Vite middleware for one-port development; built frontend served by Express in production. Use cross-platform npm commands. Honor `PORT`; default 4103. Use same-origin `/api` calls.
- Use MongoDB when `MONGODB_URI` is provided. Fail explicitly on MongoDB errors. Provide a clearly labeled local JSON demo fallback, with serialized atomic file writes, only for development. Never silently fall back when a MongoDB connection fails. Disable JSON mode in production.
- `.env.example`, `.gitignore` excluding secrets/data/build/dependencies, package lockfile, Windows-friendly README, free Render `render.yaml` with Node 24, `npm ci --include=dev && npm run build`, `npm start`, generated JWT secret and user-configured Atlas URI.
- Seed sample-only demo data in development; production seeding requires `SEED_DEMO=true` explicitly. Use owner/member accounts in Studio North and a second isolated Other Studio account. Document the sample credentials.
- Do not commit/deploy/send messages or add external services without the user's scope. This task requests editable local source.

## Acceptance checks

Run API integration tests for: login protection; lead create/edit/move/delete and persistence; negative values/invalid stages; role restrictions; workspace injection; guessed cross-workspace IDs; task ownership and invalid dates; note author injection; password hashing; one-use/expired/revoked invites; token role claims not overriding DB role; CSV isolation/formula safety. Use a temporary test database/store. Run `npm run build`. If a disposable MongoDB test instance is available, run the same permission/lifecycle checks using the Mongoose adapter and report exactly what was tested.

Manually review mobile and desktop UI. Verify every visible action. Report remaining boundaries honestly: no subscription billing, email/reset delivery, account switching, uploads, invoices or audit log unless actually implemented. Never claim the app is already live just because localhost works.

---

## 4. SupportPilot

Project folder: `04-supportpilot`

# Codex build prompt — SupportPilot

Use the following prompt to rebuild or extend this standalone project. Review existing source before modifying it; preserve working behavior and report test results truthfully.

---

Build **SupportPilot**, a polished MERN customer-support portfolio application for a small business. Deliver editable source that opens in VS Code and runs locally with one `npm run dev` command. Implement the workflows, not just visual mockups.

## Product and design

- Use a calm light canvas with a deep-violet sidebar, soft lilac accents, clear typography, restrained borders and original SVG icons.
- Provide responsive desktop/mobile screens: sign in, create workspace, customer join, admin overview, knowledge base, conversations, assistant chat and support inbox.
- Admin Overview shows actual stored counts, recent support requests, recent knowledge and the workspace's visible customer join code with a working Copy action. Do not invent analytics or customer-success metrics.
- Build real empty, loading, success and error states. Make buttons, inputs and navigation keyboard-accessible. Keep dialogs readable on mobile.
- Seed sample information clearly labeled as demo content. Do not invent testimonials, production users or client work.

## Stack and local workflow

- React + Vite, Express, Node.js 24 and Mongoose.
- One root package with `npm ci`, `npm run dev`, `npm run build`, `npm start`, `npm test` and a lockfile.
- Express hosts Vite in middleware mode during development and serves `client/dist` for the compiled application. Frontend calls same-origin `/api`.
- Respect `PORT` and a CLI `--port` override. Default to port 4104.
- Provide an instant local file-backed demo and an actual MongoDB adapter selected by `MONGODB_URI`.
- Keep `.env`, `.data`, `node_modules` and build output ignored. Supply `.env.example`, clear Windows PowerShell setup instructions and Render/Atlas deployment instructions.
- For Render use `npm ci --include=dev && npm run build`, `npm start`, Node 24 and `/api/health`. Production must reject missing MongoDB or a weak/missing JWT secret.

## Domain and permissions

- Users belong to a workspace; the server derives their workspace and role from persisted records after verifying their signed session.
- Business signup creates a new workspace and its admin. Customer join takes the business workspace code and always creates a customer, regardless of supplied role or workspace IDs.
- Hash passwords; validate emails and field lengths. Use expiring signed sessions and reasonable request limits.
- Enforce workspace scope on every read and write. Customers can view only their own conversations and tickets. Admins can view workspace conversations but cannot impersonate customers in chat.
- Keep credentials server-side and render uploaded or generated text as text, never raw HTML.

## Knowledge and assistant

- Admins create, edit, delete and search articles with title, category, text and timestamps.
- Support real `.txt` and `.md` uploads up to 64 KB. Decode strictly as UTF-8, reject binary/control data and unsafe extensions, and limit stored article content to 16,000 characters. Do not claim PDF parsing.
- Implement deterministic keyword retrieval for a zero-cost local mode. Show **Local knowledge search** in the UI so users understand it is not an AI model.
- Local answers use matching article content and display working source references. Uncovered questions explain the lack of evidence and recommend a human.
- Optionally integrate the official OpenAI Responses API when `OPENAI_API_KEY` is configured. Send only the current question and retrieved articles from that workspace. Use `store:false`, an output-token cap, a timeout and a safe local fallback.
- Never claim AI access is free. Make the model configurable with `OPENAI_MODEL`; keep keys out of frontend code. Source links must come from server retrieval, not arbitrary model-generated document IDs.
- Persist conversation history and enforce message/resource limits suitable for a portfolio demo.

## Human support

- A customer can request human help from a conversation, creating a support ticket.
- Repeated handoff clicks reuse an active ticket rather than duplicating it.
- Admins can read requests, post replies and set Open / In progress / Closed.
- Customers see their requests and can reply while a ticket is open. Closed tickets reject replies until an admin reopens them.
- Show replies inside the application. Do not display “Email sent” unless actual email delivery is implemented and configured.

## Persistence and verification

- Local writes must serialize mutations and atomically rename temporary files.
- Mongo writes must prevent lost updates between app instances, using atomic operations or optimistic compare-and-swap with retry. Document any snapshot-size and scale limitations honestly.
- Write meaningful integration tests for authentication, knowledge CRUD/import validation, workspace and object isolation, role escalation attempts, grounded answers, unknown-topic fallback, handoff idempotency, ticket replies/status and persistence.
- Test the optional AI request contract with a mock; do not silently spend API credits. Report live integration tests separately from mocked tests.
- Run tests and build. Fix failures before packaging.
- Deliver complete source, README, environment template, deployment blueprint, test suite and a concise list of known limitations. Do not present unimplemented features as complete.

---

Optional next milestones: domain-specific MongoDB collections, secure password reset, verified invitations, server-side token revocation, transactional email, human-support live updates, vector retrieval with relevance evaluation, and file parsing with a deliberate security model. Add each only after preserving the working core and extending meaningful tests.

---

## 5. ServiceHub

Project folder: `05-servicehub`

# Codex build prompt — ServiceHub tutoring marketplace

Copy the following brief into a Codex coding-agent session with an empty writable project folder.

---

Build **ServiceHub**, a complete, editable MERN tutoring-marketplace portfolio MVP. Focus on tutors only, with a warm coral, cream, and sage visual identity. The app should feel like a small, carefully designed product: original responsive typography, a welcoming two-column hero, subject pills, useful filters, tutor cards, profiles, and clear workflow states. Use CSS and inline SVG with graceful font fallbacks; keep the app usable on phones and with a keyboard. Do not invent working buttons, reviews, certifications, payment integrations, or external-service results.

## Stack and local workflow

- React frontend, Express/Node backend, Mongoose/MongoDB persistence.
- One root package.json and lockfile. Support `npm install`, `npm run dev`, `npm run build`, `npm start`, and `npm test` on Windows, macOS, and Linux with Node 24.
- Use Vite middleware on the same Express HTTP server in development. Honor `PORT`, default 4105. Production serves `client/dist` plus same-origin `/api`.
- Include an atomic JSON-file persistence adapter so the demo runs immediately without a database. Select the actual MongoDB adapter when `MONGODB_URI` is set. Clearly label file mode as local only and fail on a configured Mongo connection error.
- In production require MongoDB and a unique JWT secret of at least 32 characters. Keep `.env`, `.data`, node_modules, and build output out of source archives.

## Roles and data model

Student/customer: searches tutors, requests sessions, cancels requests, privately messages, confirms completion, and reviews completed sessions.

Tutor/provider: registers, edits own bio/rate/subjects/location/experience, accepts or declines own requests, messages own students, and requests completion.

Admin: moderates public listings, suspends/restores non-admin accounts, and resolves/reopens listing reports. Admin access does not automatically grant access to private session messages.

Store users, tutor profiles, sessions, messages, reviews, and reports. Persist stable IDs, UTC timestamps, actor IDs, and server-authoritative quote snapshots. If using a bounded aggregate document for demo simplicity, implement optimistic revision protection, document the 16 MiB limitation, and describe a migration to indexed collections.

## Functional scope

1. Register/sign in with bcrypt hashes. Public registration may choose customer/provider only, never admin. JWTs expire; authenticated routes recheck database role and suspension. Add basic API/auth rate limiting and input/body-size limits.
2. Directory filters: subject, search query, maximum hourly budget; sort by rate/rating. Tutor profile detail includes self-reported experience, biography, offered subjects, price, and only actual persisted reviews. New tutors show “New” rather than fabricated ratings.
3. Student chooses a subject offered by that tutor and a future local date/time within a bounded scheduling window, plus a learning goal. Server resolves tutor, price, and user identity. Client-supplied price, owner, role, and status are ignored.
4. Enforce `requested → accepted → completion_requested → completed`. Provider can decline requested sessions; student can cancel requested/accepted sessions. Reject invalid or unauthorized transitions. On acceptance, reject overlapping one-hour sessions for the same provider, including concurrent requests.
5. Student/provider messaging belongs to one session. Only participants can read/send messages, including requests by guessed IDs. Poll every five seconds and honestly label polling. Close sending for cancelled/declined sessions. Render text safely.
6. Only the owning student can publish one 1–5-star review after completion. Duplicate or premature reviews fail on the server. Recompute public ratings from stored reviews.
7. Authenticated users can report a tutor listing. Admin can resolve reports, publish/unpublish profiles, and suspend/restore accounts; no admin self-suspension.
8. Include believable fictional seed tutors in Mathematics, Web Development, English, Physics, Design, and Computer Science. Seed student/tutor/admin demo logins only under a documented demo flag. Provide a separate private-environment admin-bootstrap command for clean installations.

## Honest boundaries

Do not claim payments, email delivery, video calls, independent identity checks, socket realtime messaging, or certified tutors unless fully implemented and verified. This demo collects no money; a quote is illustrative. Users coordinate their own meeting links in private messages. Display dates in the browser timezone, store UTC, and state that prices are USD. Mutual completion confirmation is not verified attendance. Mark sample people/reviews as demo content and explain shared demo-account privacy.

## Deliverables and acceptance

- All editable source, env example, gitignore, package lock, sample data generator, and clear Windows/VS Code setup instructions.
- A Render free-service Blueprint with build `npm ci --include=dev && npm run build`, start `npm start`, health check `/api/health`, `NODE_ENV=production`, Node 24, MongoDB URI, generated JWT secret, and explicit demo flag.
- Explain local host versus public hosting; provide MongoDB Atlas and Render setup references without promising unchanged free-plan limits or deploying without credentials.
- Meaningful HTTP integration tests for lifecycle, authoritative price, privacy across users, public-role escalation rejection, invalid transitions, cancellation, reviews/duplicates, concurrent overlap acceptance, moderation, profile validation, and persistence across restart.
- Execute tests and build; fix observed failures. State verification limits honestly, especially if no real MongoDB/hosting account was exercised.
- Keep the implementation focused and reviewable. Do not commit credentials or bundle dependency folders. Summarize what works and what requires external configuration.

---
