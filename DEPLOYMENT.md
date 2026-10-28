# Five-app deployment plan

Source: `mern-portfolio/`. Deployment branch: `portfolio-live`.

`render.yaml` declares five separate Node web services, all explicitly using the Free compute plan and Singapore region. Each app builds and serves its React frontend and Express API on the same public origin.

| Service | Source directory | Atlas database name |
| --- | --- | --- |
| ShopFlow | `mern-portfolio/01-shopflow` | `shopflow` |
| BookEase | `mern-portfolio/02-bookease` | `bookease` |
| ClientDesk | `mern-portfolio/03-clientdesk` | `clientdesk` |
| SupportPilot | `mern-portfolio/04-supportpilot` | `supportpilot` |
| ServiceHub | `mern-portfolio/05-servicehub` | `servicehub` |

## Provisioning requirements

1. An authorized Render connection with access to this repository and workspace.
2. An authorized MongoDB Atlas connection with a Free replica-set cluster. Use separate database names for each application.
3. One generated JWT secret per Render service. The blueprint generates these secrets; no secret is committed.
4. A real MongoDB URI in each service's private `MONGODB_URI` setting. Use an app database user scoped to the corresponding demo database. Allow only the hosting service's outbound IP ranges in Atlas Network Access.
5. `SEED_DEMO=true` enables the fictional sample accounts; these are public portfolio demos. Do not enter real customer or payment data.

## Verification before sharing live links

After each service reports a successful deployment, record its actual provider-returned URL. Check `/api/health` reports MongoDB storage, then open the React UI and exercise demo login plus the primary workflow. Reopen records after refresh/reconnect to verify persistence. Do not construct or publish guessed `onrender.com` addresses.

Checkout is simulated. The helpdesk's local knowledge search works without paid API credits. External email and AI integrations remain optional and must be clearly labeled. Render Free does not support SMTP ports; the local outbox remains functional.

The five services share the account's free instance-hour allowance and can sleep while idle. Check current eligibility and usage in the Render account. This blueprint does not authorize any paid tier or paid API calls.

Prior source validation: 49 integration tests, five production frontend builds and independent real local MongoDB concurrency/persistence checks passed. See `mern-portfolio/FEATURES-AND-VALIDATION.md`. Hosted verification must still be completed before adding application links to a CV or Upwork profile.
