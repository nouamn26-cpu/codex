# ShopFlow — Workspace Essentials

A complete, editable MERN portfolio MVP: React storefront, Express API, Node.js server, and a real Mongoose/MongoDB persistence adapter. Its original ivory/sage/orange interface includes local SVG product illustrations and a desk scene, so no remote images or paid assets are needed.

**This is a fictional shop. Checkout, shipping and order value are simulated. No real payments are collected, refunds issued, or products dispatched.**

## Quick start in VS Code

Roman Urdu: Folder VS Code mein open karo. Terminal mein neeche commands chalao. MongoDB ya payment account ke baghair local demo chal jayega.

Requirements: Node.js **22.12+** or **24 LTS**, npm, and VS Code. Open **this folder**, which contains `package.json`, in VS Code.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Windows Command Prompt can use `copy .env.example .env`; macOS/Linux can use `cp .env.example .env`. On the first installation, `npm install` also works; `npm ci` uses the included exact lockfile.

Open **http://localhost:4101**. The Express server serves the React frontend and `/api` on the same port. Stop it with **Ctrl+C**. The frontend has Vite hot reload; after editing backend code, stop and restart `npm run dev`.

No `.env` is required for the local quick demo. The first development start seeds demo accounts and eight products unless `SEED_DEMO=false`. Local data persists in `.data/shopflow.json` (excluded from Git and the deliverable archive).

### Demo accounts

| Role     | Email                    | Password     |
| -------- | ------------------------ | ------------ |
| Customer | `customer@shopflow.demo` | `Demo12345!` |
| Admin    | `admin@shopflow.demo`    | `Demo12345!` |

Sign in as the customer, add a variant to your bag, and place a simulated order with **fictional** address details. Then sign out and sign in as the admin to update inventory or progress the order through processing → shipped → delivered.

The sign-in dialog can fill either account for you. You can also register a new customer. Client-supplied roles are ignored.

## What works

- Catalogue search, category filtering, maximum-price slider and sorting.
- Product detail, available variant selection, stock levels and quantity selection.
- Persistent browser bag; server-authoritative product prices, shipping and stock checks at checkout.
- Registered accounts, hashed passwords, expiring JWT sessions and role-based authorization.
- Idempotent simulated checkout: retrying the same checkout key does not duplicate the order or reserve stock twice.
- Customer order history and cancellation of newly placed orders. Cancellation restores stock exactly once.
- Admin inventory/product creation and editing, storefront visibility and order fulfillment.
- Legal fulfillment transitions; clients cannot skip directly from placed to delivered.
- Atomic local file writes, or genuine MongoDB collections with transactions when `MONGODB_URI` is present.
- Responsive layouts, labeled inputs, keyboard-focus styles, modal focus trapping, Escape dismissal and reduced-motion support.
- Same-origin API, request-size limits, rate limits, Helmet headers, and a stricter CSP in production.

Demo shipping costs **$7.50**, with **free demo shipping at $150**. All prices are USD; taxes are not modeled. Checkout never asks for card information.

## Commands

| Command         | Purpose                                                |
| --------------- | ------------------------------------------------------ |
| `npm ci`        | Install locked dependencies                            |
| `npm run dev`   | Start the single-port local app with React HMR         |
| `npm run build` | Build the frontend into `client/dist/`                 |
| `npm start`     | Serve the built frontend and API                       |
| `npm test`      | Run 12 integration tests in isolated temporary storage |

To try the built app locally, stop the development server, run `npm run build`, then `npm start`. The same localhost URL is used.

`PORT` can change the port. For example, set `PORT=4201` in `.env`, restart, and open `http://localhost:4201`. CLI `--port` takes precedence; `npm run dev -- --port 4201` also works. Local development binds to loopback by default. `--host 0.0.0.0` deliberately exposes the development server to your local network and allows proxy hostnames; use it only for an intentional trusted preview. The production server binds to `0.0.0.0` for hosting.

## Enable MongoDB / Atlas

1. Create a MongoDB Atlas Free cluster, a database user, and a network-access entry for the machine/hosting service that will connect. Keep access restricted to the documented egress addresses where possible.
2. Copy the Node connection string into `MONGODB_URI` in `.env` and include a distinct database name, for example `shopflow`.
3. Replace URI placeholders with your database credentials. URL-encode special characters in the password.
4. Restart the app. `GET /api/health` reports `storage: "mongodb"` after successful connection.

```dotenv
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/shopflow?retryWrites=true&w=majority
JWT_SECRET=replace-with-your-own-random-value-of-at-least-32-characters
SEED_DEMO=true
```

The connection string above is a placeholder, not a working credential. Never commit `.env` or share a real URI.

The adapter defines typed Mongoose **User**, **Product**, **Order** and checkout-lock models. Stock reservations and order writes run in one MongoDB transaction. An inter-instance lock document and transaction retry prevent two Node instances from overselling the final unit. Transaction operations are awaited sequentially.

**MongoDB transactions require a replica set. Atlas Free works; a standalone local `mongod` must be configured as a replica set.** If you want to avoid database setup locally, leave `MONGODB_URI` empty and use the file adapter.

## Free public hosting

A localhost URL is visible on your own computer; it is not a public portfolio link. For a persistent, public MERN demo, deploy the Express service to **Render Free** and store data in **MongoDB Atlas Free**. Free plans have quotas, cold starts and availability limits; they are suitable for a portfolio demo, and you must select the free plan explicitly.

1. Push this project's source to your own Git repository. Exclude `node_modules`, `.data`, `.env`, and `client/dist`; the included `.gitignore` does this.
2. In Render, create a **Web Service**, select your repository and the **Free** instance.
3. For a standalone repo, leave Root Directory blank. If uploading the complete five-project pack, use `01-shopflow` as Root Directory.
4. Build Command: `npm ci --include=dev && npm run build`.
5. Start Command: `npm start`.
6. Set `NODE_VERSION=24`, `NODE_ENV=production`, your `MONGODB_URI`, and a random `JWT_SECRET` of at least 32 characters. Set `SEED_DEMO=true` if you want the public sample accounts and catalogue.
7. Use `/api/health` as the health check. Deploy and test the returned Render URL.

`render.yaml` is a Blueprint example for a **standalone repository**; edit its `rootDir` if you push the whole pack. It selects `plan: free` and generates the JWT secret, but you must supply the MongoDB URI yourself. No hosting account or database has been created for you.

Production intentionally refuses to start without MongoDB and a strong signing secret. This avoids silently losing hosted data on a free service's ephemeral filesystem. If `SEED_DEMO=true`, the sample credentials above are intentionally public: keep this a demo and enter no real personal information. For a real storefront, replace the sample identity/bootstrap process and implement a reviewed payment/shipping workflow.

Verified provider docs (28 October 2026):

- https://render.com/docs/free
- https://render.com/docs/deploy-node-express-app
- https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/

## Source layout

```text
client/src/main.jsx    React storefront, checkout, account and admin UI
client/src/art.jsx     Reusable icons and original product/hero SVGs
client/src/styles.css  Responsive design system
server/app.js          Validation, auth, catalogue, inventory and order APIs
server/store.js        Atomic JSON adapter + transactional Mongoose adapter
server/seed.js         Fictional product catalogue and demo-account seeding
server/index.js        Vite middleware / static frontend and server entry
test/shopflow.test.js Main workflow and authorization integration tests
BUILD_PROMPT.md        Reusable detailed Codex build prompt
render.yaml            Optional Render deployment blueprint
.env.example           Documented configuration placeholders
```

## Validation and known limits

- `npm run build`: passed.
- `npm audit`: zero reported vulnerabilities after dependency updates.
- `npm test`: all **12 integration tests** passed, including client-price tampering, authorization, ownership, idempotency, concurrent final-item checkout, stock restoration and file persistence.
- Separate root QA used a real MongoDB 7 replica set: dual-instance final-item checkout returned one success and one stock conflict; idempotent replay, cancellation and reopened persistence passed.
- File mode is a **single-process development adapter**, not shared storage for multiple server instances.
- The repositories load small demo datasets. Add database-side query filtering, pagination and finer-grained inventory transactions before large-scale use.
- The demo does not implement Stripe/PayPal, tax calculation, email, password reset, OAuth, image uploads, tracking-provider integration, returns after shipping, or automated refunds. All UI text describes the implemented demo behavior.
- Sessions are stored in browser local storage and expire after 12 hours. Development sessions reset after a restart unless a stable `JWT_SECRET` is configured.

This project is personal demo work. Present it as a portfolio case study, not an existing client engagement. See `BUILD_PROMPT.md` for the complete reusable prompt and next-step extension ideas.
