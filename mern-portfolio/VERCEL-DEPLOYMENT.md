# Vercel deployment option

The apps include a Vercel Node-function adapter while retaining their regular Express/local entry points. React assets are built into `client/dist`; each app's `api/index.js` hosts its existing Express routes and reuses a MongoDB connection across warm requests. MongoDB remains the database; this is not a browser-only storage conversion.

## Five project roots

Create one Vercel project per app from the `portfolio-live` branch of the source repository:

| Project      | Root directory in the repository |
| ------------ | -------------------------------- |
| ShopFlow     | `mern-portfolio/01-shopflow`     |
| BookEase     | `mern-portfolio/02-bookease`     |
| ClientDesk   | `mern-portfolio/03-clientdesk`   |
| SupportPilot | `mern-portfolio/04-supportpilot` |
| ServiceHub   | `mern-portfolio/05-servicehub`   |

Each root has its own `vercel.json`. It specifies Vite, `npm ci --include=dev`, `npm run build`, output `client/dist`, one Node API function, API routing and the frontend fallback. The function region is `bom1` (Mumbai), close to the Atlas cluster region chosen for this demo. Use Node.js 24 in project settings.

## Runtime configuration

Set these in each project's private environment settings, never in Git:

| Key           | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| `NODE_ENV`    | `production`                                                      |
| `SEED_DEMO`   | `true` for the fictional portfolio demo                           |
| `JWT_SECRET`  | A unique generated secret of at least 32 characters per app       |
| `MONGODB_URI` | A URI for this app's database, using its restricted database user |

Use separate database names and database users for the five apps. `maxPoolSize=5` in the MongoDB URI keeps the connection pool small for these demos. Public API requests return a generic 503 until both MongoDB and JWT settings are present; local file storage is not used by the hosted adapter. Startup failures can recover on a later request after configuration is corrected.

## Database network access

Atlas must allow the network from which functions connect. Vercel's default outbound addresses are dynamic. Fixed outbound IP features require eligible paid Vercel plans; do not enable paid features for this free-demo task. A broader Atlas rule such as `0.0.0.0/0` allows any internet IP to attempt a database connection, while authentication is still required. Broader network access and transferring credentials to a hosting provider require the account owner's explicit approval. Use only fictional demo data and per-app database roles.

Official references:

- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/plans/hobby
- https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address
- https://www.mongodb.com/docs/atlas/security/ip-access-list/

Hobby is intended for eligible personal/non-commercial projects and has usage limits. Review the current plan terms in your account; this configuration does not authorize paid upgrades or paid API calls. Checkout remains simulated and helpdesk AI remains optional.

## Validation performed

All five adapters passed checks with a temporary real MongoDB replica set: missing-config protection, 12 simultaneous cold-start health requests, actual demo login, an authenticated application route, and a connection restart. Existing business APIs and frontend code are retained.

The adapter is not a deployed application by itself. Before sharing links, verify actual provider-returned production URLs, `/api/health`, demo login, main user flows, and persistent records. Production URLs must not require the reviewer to sign into a hosting account.
