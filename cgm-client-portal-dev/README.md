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

- Household-only client portal with visit notes, history, client notes and
  private image uploads.
- Staff dashboard for household creation, updates, activation and private
  administration.
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
For an existing D1 database, apply
`migrations/0002-client-passwords-and-plan.sql` once. Fresh local databases get
the same fields directly from `db/schema.sql`.
