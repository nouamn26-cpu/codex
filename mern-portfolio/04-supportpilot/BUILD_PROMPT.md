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
