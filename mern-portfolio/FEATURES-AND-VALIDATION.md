# Features and validation

These are five independently runnable portfolio MVPs. Each includes React, an Express/Node API, Mongoose-backed MongoDB persistence, an optional local file demo, authentication, sample data, setup instructions and a detailed build prompt.

## What is implemented

| Project      | Working flows                                                                                                                                                                    | Integration boundaries                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ShopFlow     | Product/category/search/price filtering, variants, cart, server-priced simulated checkout, order history/cancellation, inventory and admin fulfillment                           | Payments and shipping are simulated. No Stripe, tax engine or real order fulfillment.                                                                           |
| BookEase     | Services, staff, duration-aware availability, booking/rescheduling/cancellation, customer/team/admin dashboards, service editor, reminder generation and notification outbox     | Pay at studio. Reminders are manually generated; SMTP is optional and was not tested against an external mail account. Render Free blocks SMTP.                 |
| ClientDesk   | Workspace signup, isolated CRM, dashboard, leads pipeline, clients, owned tasks, notes, expiring single-use invites, settings and CSV export                                     | Invite codes are manually shared. No email invitation delivery, subscriptions or password recovery.                                                             |
| SupportPilot | Workspace/customer signup, knowledge articles, plain text/Markdown upload, grounded local answers with source links, chat history, fallback/handoff, tickets and support replies | Local knowledge search is the default. Optional OpenAI API code is included; paid live calls were not made. No PDF parsing, outbound mail or password recovery. |
| ServiceHub   | Tutor discovery/filtering, provider profiles, request/accept/decline/complete lifecycle, private request threads, completed-session reviews and admin moderation                 | Messaging polls or refreshes; no Socket.IO, video sessions, real payments or identity verification service.                                                     |

## Automated checks

All **49 included integration tests passed** on Node.js 24.22.1. Per-project tests run against disposable local data and exercise actual API behavior.

| App          | Passing tests | Main checks                                                                                                                                                |
| ------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ShopFlow     | 12            | Authorization, server totals, variants, concurrent stock protection, duplicate checkout, cancellation/restock and persistence                              |
| BookEase     | 12            | Auth/roles, overlapping appointments, concurrent booking race, reschedule/cancel release, date/duration validation, completion timing and outbox/reminders |
| ClientDesk   | 10            | Auth, two-workspace isolation, leads/clients/tasks/notes, member restrictions, single-use invites, CSV and persistence                                     |
| SupportPilot | 9             | Knowledge ingest, grounded retrieval, unknown-answer fallback, handoff/replies, workspace/customer isolation and mocked AI-provider contract               |
| ServiceHub   | 6             | Request lifecycle, overlapping sessions, private messages, reviews, admin restrictions/suspension and persistence                                          |

All five production frontend builds passed. Final runtime dependency audits reported zero known advisories at the time of generation; this records the checked dependency versions rather than a future guarantee.

## Real MongoDB verification

The MongoDB adapters were additionally checked against a temporary **MongoDB 7.0.24 replica set**, with two independent adapter/API instances per app and data read back after reopening the connection.

- ShopFlow: two checkouts raced for the last item; one succeeded and one returned conflict. Retrying the same checkout returned the existing order; cancellation restored stock. Rechecked after the Mongoose update.
- BookEase: two same-slot bookings produced one success and one conflict. Rescheduling/cancellation and reopened records passed.
- ClientDesk: 12 concurrent writes persisted, cross-workspace access returned 404, and only one concurrent use of an invite succeeded.
- SupportPilot: 12 concurrent writes persisted; knowledge answers, source references, ticket handoff/reply and workspace isolation passed.
- ServiceHub: conflicting tutor-session accepts produced one success and one conflict; message privacy, suspension enforcement and reopened records passed.

MongoDB Atlas itself was not provisioned. A public Render deployment was not created. The guide includes the account/environment setup that remains necessary for your public live links.

## Browser verification

Browser checks use the actual development servers and fictional demo records. The main flows checked are storefront product/variant/cart/checkout, customer appointment creation, CRM navigation, knowledge chat and tutor discovery/request UI. See each README for demo accounts.

## Storage and scale

- The local JSON adapters serialize writes and use atomic file replacement. Run one Node process for a given local data file.
- ShopFlow and BookEase use MongoDB transactions; use Atlas or another replica set, rather than a standalone MongoDB server without transaction support.
- ClientDesk uses separate Mongoose collections with workspace-scoped queries.
- SupportPilot and ServiceHub intentionally store bounded domain snapshots with optimistic concurrency control. They are readable small-dataset portfolio implementations; MongoDB's document size limit applies. Split their domains into separate indexed collections before expanding to a large dataset.
- No private environment files, user-uploaded content, database runtime files or dependency folders are included in the source archives. Sample records are generated by the app.

## Reproduce locally

From the pack root, run `npm run install:all`, `npm run build:all`, and `npm test`. Or open one app folder and run its individual npm scripts. Extra real-Mongo concurrency checks described above were independent verification; the included default suite does not download or start MongoDB.
