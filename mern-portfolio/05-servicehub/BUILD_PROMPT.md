# Codex build prompt — ServiceHub tutoring marketplace

Copy the following brief into a Codex coding-agent session with an empty writable project folder.

---

Build **ServiceHub**, a complete, editable MERN tutoring-marketplace portfolio MVP. Focus on tutors only, with a warm coral, cream, and sage visual identity. The app should feel like a small, carefully designed product: original responsive typography, a welcoming two-column hero, subject pills, useful filters, tutor cards, profiles, and clear workflow states. Use CSS and inline SVG with graceful font fallbacks; keep the app usable on phones and with a keyboard. Do not invent working buttons, reviews, certifications, payment integrations, or external-service results.

## Stack and local workflow

- React frontend, Express/Node backend, Mongoose/MongoDB persistence.
- One root package.json and lockfile. Support `npm install`, `npm run dev`, `npm run build`, `npm start`, and `npm test` on Windows, macOS, and Linux with Node 24.
- Use Vite middleware on the same Express HTTP server in development. Honor `PORT`, default 4105. Production serves `client/dist` plus same-origin `/api`.
- Include an atomic JSON-file persistence adapter so the demo runs immediately without a database. Select the actual MongoDB adapter when `MONGODB_URI` is set. Clearly label file mode as local only and fail on a configured Mongo connection error.
- In production require MongoDB and a unique JWT secret of at least 32 characters. Keep `.env`, `.data`, node_modules, and build output out of source archives.

## Roles and data model

Student/customer: searches tutors, requests sessions, cancels requests, privately messages, confirms completion, and reviews completed sessions.

Tutor/provider: registers, edits own bio/rate/subjects/location/experience, accepts or declines own requests, messages own students, and requests completion.

Admin: moderates public listings, suspends/restores non-admin accounts, and resolves/reopens listing reports. Admin access does not automatically grant access to private session messages.

Store users, tutor profiles, sessions, messages, reviews, and reports. Persist stable IDs, UTC timestamps, actor IDs, and server-authoritative quote snapshots. If using a bounded aggregate document for demo simplicity, implement optimistic revision protection, document the 16 MiB limitation, and describe a migration to indexed collections.

## Functional scope

1. Register/sign in with bcrypt hashes. Public registration may choose customer/provider only, never admin. JWTs expire; authenticated routes recheck database role and suspension. Add basic API/auth rate limiting and input/body-size limits.
2. Directory filters: subject, search query, maximum hourly budget; sort by rate/rating. Tutor profile detail includes self-reported experience, biography, offered subjects, price, and only actual persisted reviews. New tutors show “New” rather than fabricated ratings.
3. Student chooses a subject offered by that tutor and a future local date/time within a bounded scheduling window, plus a learning goal. Server resolves tutor, price, and user identity. Client-supplied price, owner, role, and status are ignored.
4. Enforce `requested → accepted → completion_requested → completed`. Provider can decline requested sessions; student can cancel requested/accepted sessions. Reject invalid or unauthorized transitions. On acceptance, reject overlapping one-hour sessions for the same provider, including concurrent requests.
5. Student/provider messaging belongs to one session. Only participants can read/send messages, including requests by guessed IDs. Poll every five seconds and honestly label polling. Close sending for cancelled/declined sessions. Render text safely.
6. Only the owning student can publish one 1–5-star review after completion. Duplicate or premature reviews fail on the server. Recompute public ratings from stored reviews.
7. Authenticated users can report a tutor listing. Admin can resolve reports, publish/unpublish profiles, and suspend/restore accounts; no admin self-suspension.
8. Include believable fictional seed tutors in Mathematics, Web Development, English, Physics, Design, and Computer Science. Seed student/tutor/admin demo logins only under a documented demo flag. Provide a separate private-environment admin-bootstrap command for clean installations.

## Honest boundaries

Do not claim payments, email delivery, video calls, independent identity checks, socket realtime messaging, or certified tutors unless fully implemented and verified. This demo collects no money; a quote is illustrative. Users coordinate their own meeting links in private messages. Display dates in the browser timezone, store UTC, and state that prices are USD. Mutual completion confirmation is not verified attendance. Mark sample people/reviews as demo content and explain shared demo-account privacy.

## Deliverables and acceptance

- All editable source, env example, gitignore, package lock, sample data generator, and clear Windows/VS Code setup instructions.
- A Render free-service Blueprint with build `npm ci --include=dev && npm run build`, start `npm start`, health check `/api/health`, `NODE_ENV=production`, Node 24, MongoDB URI, generated JWT secret, and explicit demo flag.
- Explain local host versus public hosting; provide MongoDB Atlas and Render setup references without promising unchanged free-plan limits or deploying without credentials.
- Meaningful HTTP integration tests for lifecycle, authoritative price, privacy across users, public-role escalation rejection, invalid transitions, cancellation, reviews/duplicates, concurrent overlap acceptance, moderation, profile validation, and persistence across restart.
- Execute tests and build; fix observed failures. State verification limits honestly, especially if no real MongoDB/hosting account was exercised.
- Keep the implementation focused and reviewable. Do not commit credentials or bundle dependency folders. Summarize what works and what requires external configuration.

---
