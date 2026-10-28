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
