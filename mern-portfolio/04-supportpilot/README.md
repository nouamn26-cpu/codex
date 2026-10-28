# SupportPilot — MERN customer support helpdesk

An editable, standalone full-stack portfolio project. Knowledge articles, source-linked chat answers and human support tickets work together in one responsive React app. Local knowledge search costs nothing and works without an AI account. Optional OpenAI answers require your own API account and may incur charges.

## Quick start — Windows / VS Code

1. Install **Node.js 24 LTS**. Extract this folder and open **this project folder** in VS Code.
2. Open **Terminal → New Terminal**. Run:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

3. Open **http://localhost:4104**. This is a local development address; it is not a public internet link.
4. Select **Workspace admin** or **Customer** on the sign-in screen to explore the seeded demo.

For macOS/Linux, replace `Copy-Item .env.example .env` with `cp .env.example .env`.

No MongoDB installation is needed for the local demo. The Express backend persists data in `.data/supportpilot.json`. Do not run multiple server processes against the same local data directory. Use MongoDB for deployment and multi-process persistence.

The frontend refreshes automatically through Vite HMR. Restart `npm run dev` after editing backend files or `.env`. You can override the port with `npm run dev -- --port 4204` or the `PORT` setting.

## Demo accounts

| Role           | Email                      | Password | Workspace     |
| -------------- | -------------------------- | -------- | ------------- |
| Admin          | owner@supportpilot.demo    | Demo123! | Acme Studio   |
| Customer       | customer@supportpilot.demo | Demo123! | Acme Studio   |
| Separate admin | orbit@supportpilot.demo    | Demo123! | Orbit Company |

The shared demo includes sample knowledge articles and one support request. Use sample information only. Seeding happens **only on a new empty data store**. Locally the default is enabled; in production the default is disabled. The included Render blueprint explicitly enables seeding for a portfolio demo. Set `SEED_DEMO=false` for your own empty installation, then create a workspace through the sign-up screen.

New admins create their own isolated workspace. The admin Overview shows a **workspace code** and **Copy code** action. A customer can select **Join support** on the sign-in screen and enter that code. The code admits customers, never admins. It is a business routing code, not a secret invitation token.

## What works

- Workspace creation, customer join, login and logout with password hashing and expiring signed sessions.
- Server-enforced admin/customer permissions and workspace isolation. Customers can access only their own conversations and tickets.
- Knowledge article create/edit/delete, category/search and plain **UTF-8 `.txt`/`.md` upload**. Uploads are limited to 64 KB and articles to 16,000 characters. Executable extensions, binary data and invalid UTF-8 are rejected.
- Deterministic keyword retrieval, answer source links, saved conversations and a fallback when the knowledge base does not cover a question.
- Optional server-side OpenAI Responses API integration using only the retrieved articles from the current workspace. API failures fall back to local search without exposing credentials or provider details.
- Idempotent human handoff: repeated clicks reuse an existing active support ticket.
- Support ticket replies, status changes and customer reply visibility. Replies appear in the app; **no email is sent**.
- MongoDB persistence via Mongoose, with optimistic compare-and-swap writes to prevent lost updates between app instances. File persistence uses a serialized queue and atomic rename.
- Responsive desktop/mobile UI, safe React text rendering, API input validation, rate limits and security headers.

## Free local search and optional AI

The default assistant visibly says **Local knowledge search**. It matches meaningful keywords and returns matching article text with source links. This is not a trained language model or vector search. Unknown topics recommend human help.

Try:

- “What is your return policy?”
- “How long does shipping take?”
- “How do I cancel my subscription?”
- An unrelated question to see the human-help fallback.

For AI-enhanced wording, add these server-only settings to `.env` and restart:

```dotenv
OPENAI_API_KEY=your-own-key
OPENAI_MODEL=gpt-4.1-mini
```

Choose a model available to your API account. The implementation calls `POST https://api.openai.com/v1/responses` with `store:false`, a 20-second timeout and a 450-token output cap. Retrieved knowledge text and the current question are sent to that provider; conversation history is not sent. Review your data before enabling a third-party provider. The UI labels AI output and links the retrieved sources. Source references demonstrate which documents were supplied; they do not guarantee that a generated answer is correct.

Official API contract: https://developers.openai.com/api/reference/resources/responses/methods/create

## Use real MongoDB

1. Create a local MongoDB database or an Atlas Free cluster.
2. Create a database user and configure network access for your application.
3. Set the connection string in `.env` with a database name:

```dotenv
MONGODB_URI=mongodb+srv://USER:PASSWORD@YOUR-CLUSTER/supportpilot
JWT_SECRET=replace-with-a-unique-random-value-of-at-least-32-characters
```

4. Restart. `/api/health` will show `storage: "mongodb"`.

Use a **different database name** for each of your five portfolio apps. MongoDB credentials must remain in `.env` or hosting secrets. Do not commit `.env` or `.data` to GitHub. File-mode data is not automatically imported when switching to MongoDB. The new database begins empty or seeded, depending on `SEED_DEMO`.

## Build and run the production bundle locally

```powershell
npm run build
npm start
```

This serves the compiled React frontend and `/api` from the same Express server. If `NODE_ENV=production` is set, both a real MongoDB URI and a unique JWT secret of at least 32 characters are mandatory. `npm start` without that production flag can still use local demo storage.

## Publish a public demo — Render + Atlas

The included `render.yaml` is a Render Blueprint for one free web service. It builds both sides, serves them together and uses Atlas for durable data.

1. Push this project folder to your own GitHub repository. Commit the source and `package-lock.json`; exclude `.env`, `.data`, `node_modules` and `client/dist`.
2. Create an Atlas Free cluster and a database user. Allow the Render service's outbound IP ranges in Atlas Network Access. Use Render's current documentation to find those ranges.
3. In Render, choose **New → Blueprint**, select the repository and fill in `MONGODB_URI`. Alternatively choose **Web Service**, choose the **Free** instance type and configure the settings below.
4. If your repository contains the entire portfolio pack, select this project's folder as the service's **Root Directory**.
5. Open the HTTPS URL Render supplies after a successful deployment.

| Setting       | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Runtime       | Node                                                                |
| Node version  | 24                                                                  |
| Build command | `npm ci --include=dev && npm run build`                             |
| Start command | `npm start`                                                         |
| Health check  | `/api/health`                                                       |
| `NODE_ENV`    | `production`                                                        |
| `MONGODB_URI` | Your private Atlas connection string ending in `/supportpilot`      |
| `JWT_SECRET`  | Unique generated secret, at least 32 characters                     |
| `SEED_DEMO`   | `true` for the shared portfolio demo; `false` for a fresh workspace |

Render's free services have usage quotas and sleep when idle. Free resources are suitable for portfolio demos; availability and pricing can change. Do not store real customer information in a shared demo. Atlas Free has its own storage and connection limits. See the pack's deployment guide for the current verified limits and source links.

VS Code Live Server alone cannot run this backend. Use `npm run dev` locally or deploy the Node server. There is no need for a separate static frontend host.

## Tests and project structure

```powershell
npm test
npm run build
```

Tests use temporary files and ephemeral local HTTP listeners; they do not require cloud credentials or make real AI requests. Coverage includes login, article CRUD and import validation, workspace signup/join, role escalation attempts, cross-workspace and cross-customer isolation, source-grounded answers, unknown-question fallback, handoff idempotency, authorized ticket replies and persistence. AI behavior is tested against a mocked Responses API contract and a simulated provider outage.

```text
client/src/main.jsx      React screens and API interactions
client/src/styles.css    Responsive visual system
server/index.js         HTTP startup, Vite dev and compiled frontend
server/app.js           Express routes, authentication and authorization
server/store.js         Mongoose + local file adapters, demo seeding
server/knowledge.js     Retrieval and optional OpenAI integration
tests/api.test.js       Meaningful workflow and access-control tests
BUILD_PROMPT.md         Detailed prompt for rebuilding/extending the app
render.yaml             Deployment blueprint
```

## Honest scope and extension points

This is a portfolio MVP, not a production support platform. It does not include billing, PDF parsing, embeddings/vector search, website crawling, email delivery, password reset, MFA, organization-wide SSO or real-time push. Tickets update when you perform an action or reload the page. Sessions last eight hours; logout removes the browser token but does not revoke that token server-side. Customer join does not verify email ownership.

MongoDB stores a small domain snapshot in one document with revision checking. This keeps the demo easy to understand and gives atomic updates, but it is bounded by MongoDB's document-size limit and is not a design for a large helpdesk. Split domain collections and add transactional indexes before scaling. Local file mode supports one app process only. Public signup and workspace resource caps reduce accidental demo growth but are not a replacement for production abuse controls.

The actual paid AI endpoint was not called during creation. The integration contract and fallback were tested with mocks. The accompanying review also exercised MongoDB persistence, concurrent writes through two independent app instances, grounded answers, handoff and workspace isolation against a local MongoDB replica set.
