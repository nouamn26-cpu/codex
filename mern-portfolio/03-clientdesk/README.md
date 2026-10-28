# ClientDesk — Agency CRM

A complete personal portfolio MVP built with **React, Express, Node.js and MongoDB/Mongoose**. It includes a working local file-storage demo so it can be opened and run without creating a cloud account first. The interface clearly identifies the active storage mode.

## Quick start in VS Code (Windows, macOS or Linux)

Install **Node.js 24 LTS** and open this `03-clientdesk` folder directly in VS Code. In the integrated terminal run:

```bash
npm install
```

Copy `.env.example` to `.env` using VS Code's file explorer. Then run:

```bash
npm run dev
```

Open **http://localhost:4103**. Express and Vite share this one port. Vite refreshes frontend changes automatically; restart the command after editing backend files. No VS Code Live Server extension is needed: Live Server alone cannot run an Express API.

For a production-style local preview:

```bash
npm run build
npm start
```

Stop the running server with Ctrl+C before starting another command on the same port. You can set `PORT` in `.env`, or run `npm run dev -- --port 5103`, to change it. To run a second project at the same time, use its own terminal and folder.

## Demo accounts

All three accounts use the password **`DemoPass123!`**:

| Email                    | Role   | Workspace    |
| ------------------------ | ------ | ------------ |
| `owner@clientdesk.demo`  | Admin  | Studio North |
| `member@clientdesk.demo` | Member | Studio North |
| `other@clientdesk.demo`  | Admin  | Other Studio |

Demo data seeds automatically in development, or when `SEED_DEMO=true`. Production defaults to no seed. The second workspace demonstrates data isolation: sign in with its account to see a separate pipeline. You can create your own empty workspace from the sign-in screen. Demo accounts are for sample data only; use `SEED_DEMO=false` for a private deployment. **Changing this flag does not remove accounts or records already seeded.** Use a fresh database for a private installation, or deliberately remove the seeded users and sample records before storing private information.

## Implemented features

- Workspace registration and bcrypt-hashed passwords; 8-hour JWT sessions. The server loads role and workspace from the user database for every authenticated request.
- Dashboard numbers derived from real stored leads, clients and tasks; pipeline stage chart, upcoming work and recent opportunities.
- Lead create/edit/delete; search; drag-and-drop Kanban plus keyboard-friendly stage select menus; server validation of money, email, stage and source.
- Clients CRUD, statuses and filters. Members can view; admins can change client records.
- Task assignment, real due-date validation, priority, completion and editing. Members can modify only their assigned tasks; admins can assign any teammate in the same workspace.
- Workspace notes with authenticated author attribution and delete permissions.
- Team list and admin-created single-use member invite codes, valid for seven days. Invite hashes are stored; the raw code is shown once for manual sharing. Codes can be revoked. No email is sent.
- Workspace name editing, CSV export with spreadsheet formula neutralization, responsive navigation, useful empty/error states and accessible labels.
- Every data lookup or modification is scoped to the authenticated workspace; cross-workspace record IDs return 404.

## MongoDB mode

Create a free MongoDB Atlas cluster or run MongoDB locally, then set your connection string in `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/clientdesk
JWT_SECRET=your-own-long-random-secret-at-least-32-characters
SEED_DEMO=true
```

For Atlas, use the `mongodb+srv://...` URI from Atlas, URL-encode special characters in the database-user password, and allow your application's outgoing IP in Atlas Network Access. Restart the server. `/api/health` and Settings show `mongodb` when connected. Separate Mongoose models/indexes store workspaces, users, leads, clients, tasks, notes and invites. Connection errors fail startup explicitly; the server never silently switches databases.

Without `MONGODB_URI`, records persist to `.data/clientdesk.json` on your own machine. File writes are serialized and written via atomic rename. File mode is suitable for one local process only and is deliberately disabled in `NODE_ENV=production`. Local JSON data is **not** automatically migrated to MongoDB. To reset the local demo, stop the app, delete `.data`, and restart with demo seeding enabled.

## Free public hosting

The included `render.yaml` defines one free Render Node web service. Push **this folder's contents** into your own GitHub repository, then connect that repository in Render. Alternatively use a monorepo and set the service's Root Directory to this subfolder. A Blueprint `render.yaml` must be at the repository root when using Render's Blueprint import.

- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Node: 24
- Environment: `NODE_ENV=production`, a private `MONGODB_URI`, and a generated `JWT_SECRET` of at least 32 random characters.
- Set `SEED_DEMO=true` only for a public **sample-data** portfolio demo. Otherwise leave it false and register a new workspace.
- Render injects `PORT`; do not hardcode it on Render. The app serves both frontend and API from one origin.

Free web services may sleep and have shared monthly quotas; check the provider's current limits before deploying all five projects. MongoDB Atlas offers a free cluster with limited storage. Never put `.env`, connection credentials, private customer data, `.data` or `node_modules` in Git. See the pack's free-hosting guide for current official links.

`localhost` is visible on your machine. A public Render URL is needed for an Upwork client to open the demo. This source pack does not create a hosting account or an already-live public deployment.

## Verification

```bash
npm test
npm run build
```

The API tests cover authorization, persistent lead lifecycle, workspace injection/ID attacks, client roles, task ownership and invalid dates, note authorship, password hashing, invite single-use/expiry/revocation, untrusted token-role claims and CSV scope/formula safety. Tests use an isolated temporary local file store and delete it afterward. A real MongoDB server is not required for this default test suite. Additional pack QA exercised a disposable MongoDB 7 replica set: twelve concurrent lead creates across two independent store/API instances persisted, foreign workspace IDs returned 404, the same invite could be consumed only once under concurrent joins, and records survived reopening the database. This external QA harness is not included in this app's default test command.

## Structure

| Path                    | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `client/src/main.jsx`   | React interface and user workflows                          |
| `client/src/styles.css` | Responsive original visual design                           |
| `server/app.js`         | REST API, validation, auth, workspace policies              |
| `server/store.js`       | Persistent file adapter and Mongoose adapter                |
| `server/seed.js`        | Sample-only demo dataset                                    |
| `server/index.js`       | Configuration, startup and Vite/static hosting              |
| `tests/api.test.js`     | API workflow and access regression tests                    |
| `BUILD_PROMPT.md`       | A detailed prompt to rebuild/extend this project with Codex |

## Deliberate MVP boundaries

No payment/subscription billing, outgoing email, password-reset delivery, file uploads, multiple workspace switching, member removal, CRM activity audit log, invoice generation or automated recurring jobs. The dashboard's “won revenue” is the sum of won lead values, **not** a payment ledger. Invite codes are manually shared. The sample graphic on the sign-in page is decorative; authenticated dashboard charts use stored data. Sessions are stored in the current browser tab's session storage; signing out removes that tab's token. Production hardening such as audited changes, verified email/recovery, account lifecycle management and monitoring would be a separate project phase.

Use this as **Personal Demo Project** in your portfolio; do not describe it as paid client work or claim measured business results.
