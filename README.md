# MERN Portfolio Projects

Five original, independently runnable portfolio demos built with MongoDB, Express, React and Node.js.

## Live applications

All five production deployments were verified on October 28, 2026. Public pages and compiled assets returned HTTP 200, MongoDB Atlas health checks confirmed database storage, and demo logins plus authenticated data requests passed. Browser checks confirmed that the interfaces and live data render.

| Project | Live link | Features |
| --- | --- | --- |
| ShopFlow | https://shopflow-nouamn-portfolio.vercel.app/ | Product catalog, cart, simulated checkout, orders and administration |
| BookEase | https://bookease-nouamn-portfolio.vercel.app/ | Salon services, availability, appointments, staff/admin views and notification outbox |
| ClientDesk | https://clientdesk-nouamn-portfolio.vercel.app/ | Agency CRM with workspaces, leads, clients, tasks and reports |
| SupportPilot | https://supportpilot-nouamn-portfolio.vercel.app/ | Knowledge base, local knowledge search, conversations and support tickets |
| ServiceHub | https://servicehub-nouamn-portfolio.vercel.app/ | Tutor marketplace with session requests, messages, reviews and moderation |

## Try the demos

ClientDesk and SupportPilot have demo entry buttons. The other apps offer demo accounts in their sign-in dialogs.

| Project | Demo email | Demo password |
| --- | --- | --- |
| ShopFlow | customer@shopflow.demo | Demo12345! |
| BookEase | customer@bookease.demo | Demo123! |
| ClientDesk | owner@clientdesk.demo | DemoPass123! |
| SupportPilot | owner@supportpilot.demo | Demo123! |
| ServiceHub | student@servicehub.demo | DemoPass123! |

These public credentials access fictional sample records. Use sample information when exploring. Payments and email delivery are simulated, SupportPilot uses local knowledge search by default, and ServiceHub does not provide built-in video calls.

## Source and local development

The `portfolio-live` branch contains complete editable source under `mern-portfolio/`. Each app includes its own README, build prompt, package lock, `.env.example`, and hosting configuration. Open an individual app folder in VS Code, run `npm ci`, copy `.env.example` to `.env`, and follow its README. Local JSON demo storage can be used without a cloud database.

## Hosting

The five apps are deployed to Vercel production projects with separate MongoDB Atlas databases. Database credentials and unique signing secrets are stored as private, production-scoped Vercel variables and are excluded from source. The verified deployed application source is commit `cc0982080902577181ffb5a933e35c6eca3898df`.

These are personal portfolio demos on free service tiers. Availability is subject to provider quotas and account status; an initial API request may take longer after inactivity. Deployment was performed by uploading source through the authorized Vercel connection. Future Git pushes do not automatically deploy until Git integration is connected.
