# RESTORE LOGIN ACCESS — CGM Client Portal (user + admin)

This guide restores sign-in for **household (user) accounts** and the **master admin** account.
It also lists what was repaired in the repository so the login system is complete again.

---

## 0. What was wrong (summary)

| Finding | Effect |
|---|---|
| The repo-root `functions/api/` folder was missing the newer portal API files (`auth-login.js`, `auth-password-change.js`, `client-visits.js`, `client-messages.js`, `client-feedback.js`, `admin-plan.js`, `client-invoice-action.js`, `portal-records.js`, plus newer versions of `client-data.js`, `client-image.js`, `client-invoices.js`, `admin-clients.js`, `admin-invoices.js`, `admin-invoice-create.js`, `_lib/invoices.js`) | The login page posts to `/api/auth-login`. Wherever the root deployment served the login pages, password sign-in could not work — it looked like "login removed" |
| `db/schema.sql` at repo root was the old 5-table version (no passwords, visits, messages, plan, invoices) | Even with functions present, a fresh D1 built from root schema had no password columns |
| Household/admin credentials unknown or lost | Endpoints respond `401 Invalid credentials` — the system runs, but no working sign-in existed |

**Repaired in this repository:** all missing/newer API files copied from the tested
`cgm-client-portal-dev` build (14/14 automated tests pass), full schema + migrations
synced, portal sub-pages added. Nothing existing was removed.

---

## 1. Restore the ADMIN login (no database needed)

The admin password lives in the Cloudflare Pages **environment variables** of the
portal project (`chilterngardenmaintenance-updatedsite-portal`).

1. Cloudflare dashboard → **Workers & Pages** → `chilterngardenmaintenance-updatedsite-portal`
2. **Settings** → **Variables and Secrets** (for *Production*, and repeat for *Preview*)
3. Set / update:

   | Variable | Value |
   |---|---|
   | `MASTER_ADMIN_USER` | `cgm-admin` (or your preferred admin username) |
   | `MASTER_ADMIN_PASS` | `sha256:69305d2d73e918f22f04619bc29cec379ba791f56603a19c4b150193f07d496f` |

   That hash is `sha256("CGM-Admin-2026!")` — so the temporary admin password is:

   **Username:** `cgm-admin`  **Password:** `CGM-Admin-2026!`

4. **Save**, then **Deployments → Retry/Create deployment** so the new variables take effect.
5. Sign in at `/portal/admin/` and **change the password immediately**
   (Settings → Variables → set a new `sha256:` hash; generate one with
   `printf '%s' 'YourNewPassword' | shasum -a 256` on Mac/Linux).

> If `MASTER_ADMIN_PASS` is stored as plain text instead of `sha256:...`, that also works —
> the code supports both formats.

---

## 2. Restore USER (household) logins — one SQL run

Temporary household password used below: **`CGM-Home-2026!`**

### Option A — Cloudflare dashboard (no tools needed)
1. Cloudflare dashboard → **Storage & Databases** → **D1** → open your portal database
   (the one bound as `DB` — e.g. `cgm-portal-preview-db`)
2. Open the **Console** tab
3. First run the migrations once (if not already applied):
   paste and run the contents of `db/migrations/0002-client-passwords-and-plan.sql`,
   then `0003-invoices.sql`, then `0004-portal-redesign-records.sql`
   *(skip any that error with "duplicate column/table" — that means it is already applied)*
4. Paste and run the contents of **`db/restore-access.sql`**
5. Verify: run the `SELECT id, username, ... FROM clients;` query at the bottom of that file —
   each account you want to log in with must show `has_password = 1`, `is_active = 1`

### Option B — command line
```bash
npx wrangler d1 execute <YOUR-D1-DATABASE-NAME> --remote --file=db/migrations/0002-client-passwords-and-plan.sql
npx wrangler d1 execute <YOUR-D1-DATABASE-NAME> --remote --file=db/migrations/0003-invoices.sql
npx wrangler d1 execute <YOUR-D1-DATABASE-NAME> --remote --file=db/migrations/0004-portal-redesign-records.sql
npx wrangler d1 execute <YOUR-D1-DATABASE-NAME> --remote --file=db/restore-access.sql
```

### Then sign in
- Client login: `/login/` → username `chilterns-household` → password `CGM-Home-2026!`
- The portal opens on your Garden Passport overview.
- **Change the password now:** Portal → **Household account** → *Change password* (min 12 characters).

### Add or reset any other household
Either use the admin dashboard (**Households → New household** — it generates the login) or
repeat the SQL pattern in `db/restore-access.sql` with a new username and a fresh hash:

```bash
cd cgm-client-portal-dev
printf '%s' 'ChosenPassword123' | npm run password:hash
# paste the printed pbkdf2_sha256$... value into the SQL
```

---

## 3. Publish the repaired repository

GitHub's API write access is currently returning `403 Resource not accessible by integration`,
so publish with **GitHub Desktop / web upload** (no token involved):

**GitHub Desktop (recommended)**
1. Open your local `chilterngardenmaintenance-updatedsite` folder in GitHub Desktop
2. Copy the contents of this repaired repo over it (keep the `.git` folder that is already there)
3. It will show the changed files: new files under `functions/api/`, `functions/_lib/`,
   `db/migrations/`, `db/restore-access.sql`, `db/seed.sql`, `portal/account|history|messages|photos|plan/`,
   updated `functions/api/client-data.js`, `client-image.js`, `client-invoices.js`, `admin-clients.js`,
   `admin-invoices.js`, `admin-invoice-create.js`, `functions/_lib/invoices.js`, `js/portal*.js`, `css/portal.css`
4. Commit message: `Restore portal login: sync full portal API + schema + access kit`
5. **Push to origin main**

**GitHub web upload (alternative)**
1. github.com → JJW37/chilterngardenmaintenance-updatedsite → **Add file → Upload files**
2. Drag the changed files/folders in (drag the *contents* of each folder, not the folder itself)
3. Commit to `main`

Cloudflare Pages auto-deploys from the push. The portal project
(`cgm-client-portal-dev/` with `pages_build_output_dir: "./public"`) needs **no changes** —
it is already deployed and healthy.

---

## 4. Verify everything works (2 minutes)

| Check | Expected |
|---|---|
| Visit `/login/` on the live site | Redirects to the portal login with username + password form |
| Log in as `chilterns-household` / `CGM-Home-2026!` | Garden Passport overview loads, private to your household |
| Portal → Visit history / Garden plan / Photos / Messages / Invoices / Household account | All six screens open with your data |
| `/portal/admin/` → `cgm-admin` / `CGM-Admin-2026!` | Admin dashboard opens, household list visible |
| Admin dashboard → open a household | You can post visit notes, plan items, invoices, messages |
| Both temporary passwords changed | Done — access is yours again |

---

## 5. If something still blocks sign-in

| Symptom | Cause | Fix |
|---|---|---|
| 401 on every attempt, even after SQL | Migrations not applied (`password_hash` column missing) | Run `0002-...sql` first (step 2.A.3) |
| 503 "portal is not configured yet" | `SESSION_SECRET` or `DB` binding missing on the Pages project | Pages → Settings → Variables/Bindings, then redeploy |
| Login works but portal pages loop to sign-in | Cookie blocked | Allow cookies for the portal domain; use HTTPS |
| Admin 401 after env change | Deployment not restarted after variable change | Deployments → Retry deployment |
| "Too many attempts" | Rate limit (5 tries / 5 min) | Wait a few minutes |
