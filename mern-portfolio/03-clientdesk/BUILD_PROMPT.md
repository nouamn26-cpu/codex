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
