# Copilot Instructions — AuraFarm

Purpose: give an AI coding agent the minimal, actionable context to be productive in this repo.

- **Big picture**: This is a Next.js 14 (App Router) monorepo-style app that serves both storefront pages and server API routes under `app/`. The backend is implemented as Next API routes using Node (TS) and MongoDB via Mongoose (models in `models/`). Frontend calls server routes using `lib/api-client.ts`.

- **Key files / entry points**:
  - `app/` — Next App Router pages and `app/api/*` for server endpoints.
  - `lib/db.ts` — MongoDB connection setup.
  - `lib/email.ts` — Email service; supports mock mode when SMTP env vars are absent.
  - `lib/auth.ts` and `lib/middleware.ts` — JWT cookie logic and protected-route checks.
  - `validations.ts` (in `lib/`) — Zod schemas used across API routes.
  - `models/` — Mongoose models (User, Admin, Product, Order, OTP, EmailTemplate).
  - `scripts/init-admin.ts` and `scripts/init-email-templates.ts` — helper CLIs used during setup.

- **Developer workflows / commands** (use exactly):
  - `npm install`
  - `npm run validate-env` — validates required env vars.
  - `npx ts-node scripts/init-admin.ts` — create initial admin (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars).
  - `npx ts-node scripts/init-email-templates.ts` — seed email templates.
  - `npm run dev` — run Next dev server (Node 18+ recommended).

- **Auth & session patterns**:
  - Customers: passwordless OTP flow (6-digit OTP stored in `OTP` model, TTL index, expire ~10m). See `app/api/auth/*` routes.
  - Admins: email+password using bcrypt. Admin login and checks implemented under `app/api/admin/*` and guarded by middleware that relies on JWT in HTTP-only cookies.

- **Validation & errors**: Zod schemas are authoritative. Mirror Zod shapes in `lib/validations.ts` and return structured errors from API routes.

- **Email system**: `lib/email.ts` toggles between console/mock and SMTP based on env vars. Templates live in the DB (`EmailTemplate` model). Templates support variables like `{{orderId}}`, `{{userName}}`, `{{status}}`, `{{totalAmount}}`, `{{products}}`.

- **Payments**: Current flow is mocked. To integrate a real gateway, modify `app/api/payment/verify/route.ts` and the checkout flow in `app/api/checkout` or checkout frontend pages.

- **Where to change behavior** (common tasks):
  - Add real email provider ⇒ `lib/email.ts` and env variables.
  - Add payment provider ⇒ `app/api/payment/verify/route.ts` and `app/api/checkout`.
  - Add/modify validation ⇒ `lib/validations.ts` and corresponding route handlers.

- **Conventions to follow**:
  - Use `lib/*` helpers (db, auth, email) rather than duplicating logic in routes.
  - Persistable templates and dynamic content are kept in DB (edit via admin UI or `scripts/init-email-templates.ts`).
  - Use HTTP-only cookies for JWTs (do not switch to localStorage for auth tokens).

- **Quick code examples** (where to look):
  - Protected admin routes use `lib/middleware.ts` — replicate this pattern for new protected endpoints.
  - OTP generation & cleanup: see `models/OTP.ts` and `app/api/auth/verify-otp/route.ts`.

- **Testing / manual checks**: There are no automated unit tests in the repo. Use the manual checklist in `README.md` and the dev server to validate flows.

- **External integrations / env vars** (must check before changes):
  - `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` are required for local setup.
  - `SMTP_*` env vars enable real email sending.
  - `RAZORPAY_*` / other payment keys are optional until real gateway integration.

If any of these areas are unclear or you want more examples (e.g., step-by-step to add Razorpay or a sample API route), tell me which section to expand.
