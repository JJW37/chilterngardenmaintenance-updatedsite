# CGM client portal — private local development

This is a separate local development build for the CGM client portal. It is
not connected to the public CGM website, GitHub Pages, a Cloudflare account,
or real client records.

It runs the same Cloudflare Pages Functions model locally with isolated D1,
R2, and KV simulations. The sample household is **The Hawthorn Household**
(`hawthorn-household`) and is strictly placeholder data.

## Start locally

1. Copy `.dev.vars.example` to `.dev.vars`, then replace the local test
   password hash and session secret. Generate the master password hash with
   `printf '%s' 'your-password' | npm run password:hash`.
2. Run `npm install`.
3. Run `npm run db:init`, then `npm run db:seed`.
4. Run `npm run dev` and open `http://127.0.0.1:8788`.

Use `hawthorn-household` from the client login page with the development-only
password supplied alongside this build. It is an isolated demonstration record,
not a client account. Sign in to the staff portal with the values from
`.dev.vars`.

## Included scope

- A six-screen Garden Passport: overview, visit history, garden plan, photo
  library, two-way messages, invoices, and household account/security.
- Operational visit records with scheduled date/time, arrival window, work
  list, client confirmation, reschedule requests, completion state and
  household feedback. Historical visit notes remain visible.
- A private, persistent two-way message thread with read receipts, optional
  authenticated photo attachments, and optional links to a visit or invoice.
- Private image uploads with optional garden area, tags, visit link, photo
  date and deliberately assigned before/after pair key. Image bytes remain
  behind the authenticated proxy; no R2 object key is exposed to a browser.
- Garden-plan Kanban board. Staff can create, edit, delete and move priorities;
  households can read the authoritative plan and contact CGM about it.
- Invoice list/detail, outstanding balance, category-based issued-work summary,
  PDF download and bank-transfer details. A household can notify CGM that it
  has made a transfer or request a payment-plan conversation; neither action
  moves money nor marks an invoice paid. Staff must record a received payment.
- Staff dashboard for household creation, updates, activation and private
  administration, including unread message indicators and direct access to a
  selected household’s message thread.
- Password-based household logins with salted PBKDF2 hashes, HttpOnly sessions
  and server-side household checks.
- A five-page private record: overview, visit history, garden plan, photo
  record, messages, and household account/security settings.
- A temporary email-link recovery route remains available for password resets
  once an email provider is configured.
- Local-only D1/R2/KV data and development email capture.

## Safety boundary

Do not run a deployment command from this project. This build has no production
database, image bucket, mail key, client data or custom domain configured.
When the experience is approved, the next stage is a separate Cloudflare preview
environment with new resources and secrets — still before any production launch.
For an existing D1 database, apply the migrations already required by that
environment in numeric order. The redesign is additive: after the earlier
password/plan and invoice migrations, apply
`migrations/0004-portal-redesign-records.sql` once before publishing this
portal bundle. Fresh local databases receive the same fields directly from
`db/schema.sql`.

## Verification

- `npm run check` performs syntax checks and runs the unit/workflow tests.
- The workflow test uses an in-memory SQLite-compatible D1 adapter to prove
  that a staff-scheduled visit can be confirmed by a household, completed,
  rated, discussed in the private thread, and paired with a payment signal
  without changing the invoice payment ledger.
