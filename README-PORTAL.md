# CGM Client Portal

A secure, per-household client portal for **Chiltern Garden Maintenance**, hosted on Cloudflare Pages. Each client logs in with a magic link sent to their email, lands on their own private household page, and can exchange notes and images 1:1 with you. Only the client and the master admin (you) can see the contents.

---

## What this gives you

| Feature | Where |
|---|---|
| **Magic-link login** – client enters their username, gets an email with a one-time link | `/login/` |
| **Per-household portal** – private page named after the client's household | `/portal/` |
| **Most-recent-visit summary** – latest visit notes shown in a highlighted callout | `/portal/#latest-visit` |
| **Full history timeline** – every note you've ever posted, newest first | `/portal/#notes` |
| **Client can post notes back** – questions, updates, anything | `/portal/#composer` |
| **1:1 image portfolio** – you upload images to the client, they upload images to you | `/portal/#portfolio` |
| **Admin dashboard** – list of all clients, search, create new, edit, send login links | `/portal/admin/dashboard/` |
| **Admin can post updates to any client** – from inside that client's portal view | `/portal/?clientId=N` |
| **Email notifications** – clients get an email when you post an update | automatic |
| **Privacy** – only the client + admin can see content; images are session-gated; no public URLs | enforced server-side |

---

## Tech stack (matches your existing site)

- **Frontend:** vanilla HTML/CSS/JS, reusing your existing brand tokens (`--forest`, `--gold`, Cormorant Garamond + Inter)
- **Backend:** Cloudflare Pages Functions (`/functions/api/*.js`) — same pattern as your existing `quote.js`
- **Database:** Cloudflare D1 (SQLite) — clients, notes, images metadata, sessions, magic-link tokens
- **Image storage:** Cloudflare R2 — actual image bytes
- **Email:** Resend (you already have a key for the booking form)
- **Rate-limit storage:** Cloudflare KV (optional but recommended for admin brute-force protection)

No new frameworks. No build step. Just push to GitHub and Cloudflare auto-deploys.

---

<<<<<<< Updated upstream
## File structure (what's in this package)

```
.
├── login/
│   └── index.html              ← client magic-link login page
├── portal/
│   ├── index.html              ← client household portal (private)
│   ├── verify/
│   │   └── index.html          ← magic-link verification interstitial
│   └── admin/
│       ├── index.html          ← master admin login
│       └── dashboard/
│           └── index.html      ← admin dashboard (manage all clients)
├── css/
│   └── portal.css              ← portal-only styles (loads on top of styles.css)
├── js/
│   ├── portal.js               ← client portal front-end
│   └── portal-admin.js         ← admin dashboard front-end
=======
## File structure (how files map to your repo)

Your existing repo `chilterngardenmaintenance-updatedsite` has a two-level layout:

```
chilterngardenmaintenance-updatedsite/              ← REPO ROOT (GitHub Desktop manages this)
├── chilterngardenmaintenance-updatedsite/          ← SUBFOLDER (all static HTML/CSS/JS/images)
│   ├── about/   booking/   css/   js/   images/   ...
│   └── (portal static files go HERE)
├── functions/                                      ← AT REPO ROOT (Cloudflare API)
│   └── api/quote.js                                ← (portal API files go HERE)
└── (portal config files go HERE)
```

This is why your existing booking page calls `fetch('/api/quote')` (no prefix)
but loads CSS from `/chilterngardenmaintenance-updatedsite/css/styles.css`
(with prefix). The portal matches this exact pattern.

### What goes where

**STEP 1 — copy into the subfolder** (`chilterngardenmaintenance-updatedsite/chilterngardenmaintenance-updatedsite/`):

```
login/
└── index.html              ← client magic-link login page
portal/
├── index.html              ← client household portal (private)
├── verify/
│   └── index.html          ← magic-link verification interstitial
└── admin/
    ├── index.html          ← master admin login
    └── dashboard/
        └── index.html      ← admin dashboard (manage all clients)
css/
└── portal.css              ← portal-only styles (loads on top of styles.css)
js/
├── portal.js               ← client portal front-end
└── portal-admin.js         ← admin dashboard front-end
```

**STEP 2 — copy to repo root** (alongside the existing `functions/` folder):
>>>>>>> Stashed changes
├── functions/
│   ├── _lib/
│   │   ├── db.js               ← D1 + CORS helpers
│   │   ├── auth.js             ← sessions, magic tokens, HMAC cookies
│   │   ├── email.js            ← Resend email sender
│   │   └── r2.js               ← R2 image helpers
│   └── api/
│       ├── auth-request.js     ← POST  send magic link
│       ├── auth-verify.js      ← GET   verify magic link, set cookie
│       ├── auth-session.js     ← GET   current session info
│       ├── auth-logout.js      ← POST  logout
│       ├── auth-admin.js       ← POST  master admin login
│       ├── client-data.js      ← GET   client portal data (notes/images/history)
│       ├── client-note.js      ← POST  add a note (client or admin)
│       ├── client-image.js     ← POST  upload image (multipart)
│       ├── client-image-get.js ← GET   fetch image bytes (session-gated)
│       ├── admin-clients.js    ← GET   list all clients (admin)
│       ├── admin-client.js     ← PATCH update client (admin)
│       ├── admin-client-create.js ← POST create new client (admin)
│       └── admin-image.js      ← DELETE delete image (admin)
├── db/
│   └── schema.sql              ← D1 schema (run once at setup)
├── wrangler.toml.example       ← copy to wrangler.toml and edit
├── .gitignore
└── README-PORTAL.md            ← this file
```

<<<<<<< Updated upstream
> **Important:** drop these files INTO the root of your existing site repo (alongside `booking/`, `about/`, `css/`, `js/`, `functions/`, etc.). They do not modify any existing files — they only add new ones. Two existing folders get new files added to them: `css/portal.css` and `js/portal.js` + `js/portal-admin.js`.
=======
> **Important:** The portal files are split into two groups (see HOW-TO-INSTALL.txt):
> - **STEP 1** (static HTML/CSS/JS) goes inside the `chilterngardenmaintenance-updatedsite/` subfolder, next to your existing `about/`, `booking/`, `css/`, `js/` folders.
> - **STEP 2** (API functions + config) goes at the repo ROOT, next to your existing `functions/` folder.
>
> No existing files are modified — only new files are added.
>>>>>>> Stashed changes

---

## Setup — step by step

### 1. Add the files to your GitHub repo

<<<<<<< Updated upstream
1. Unzip this package.
2. Copy everything into the root of your existing site repo (the folder that already contains `booking/`, `about/`, `functions/api/quote.js`, etc.).
3. In GitHub Desktop, you should now see new files staged: `login/`, `portal/`, `css/portal.css`, `js/portal.js`, `js/portal-admin.js`, new files under `functions/api/` and `functions/_lib/`, `db/schema.sql`, `wrangler.toml.example`, `.gitignore`, `README-PORTAL.md`.
4. Commit and push. Cloudflare Pages will auto-deploy.
=======
Follow **HOW-TO-INSTALL.txt** (in the zip root) — it walks you through copying STEP-1 files into the subfolder and STEP-2 files to the repo root. When you're done, your repo looks like:

```
chilterngardenmaintenance-updatedsite/              ← repo root
├── chilterngardenmaintenance-updatedsite/          ← subfolder
│   ├── about/   booking/   css/   js/   ...        ← existing
│   ├── login/                                      ← NEW
│   ├── portal/                                     ← NEW
│   ├── css/portal.css                              ← NEW
│   ├── js/portal.js                                ← NEW
│   └── js/portal-admin.js                          ← NEW
├── functions/                                      ← existing
│   ├── api/quote.js                                ← existing
│   ├── api/auth-request.js                         ← NEW
│   ├── api/auth-verify.js                          ← NEW
│   ├── api/... (13 more API files)                 ← NEW
│   └── _lib/ (db, auth, email, r2)                 ← NEW
├── db/schema.sql                                   ← NEW
├── wrangler.toml.example                           ← NEW
├── .gitignore                                      ← NEW
└── README-PORTAL.md                                ← NEW
```
3. In GitHub Desktop, you should see ~29 new files staged. Commit with a message like "Add client portal" and push. Cloudflare Pages will auto-deploy.
>>>>>>> Stashed changes

> The site will deploy successfully even before you wire up D1/R2 — but the portal API will return errors until the bindings are added (next steps).

### 2. Create the D1 database

In a terminal with `wrangler` installed (or via the Cloudflare dashboard):

```bash
npx wrangler login
npx wrangler d1 create cgm-portal-db
```

Note the `database_id` printed in the output.

### 3. Create the R2 bucket

```bash
npx wrangler r2 bucket create cgm-portal-images
```

### 4. Create the KV namespace (for admin rate-limiting)

```bash
npx wrangler kv namespace create PORTAL_KV
```

Note the `id` printed.

### 5. Apply the database schema

```bash
# Apply to production (remote)
npx wrangler d1 execute cgm-portal-db --remote --file=db/schema.sql

# Optional: also apply to a local copy for testing
npx wrangler d1 execute cgm-portal-db --local --file=db/schema.sql
```

### 6. Wire up the bindings in Cloudflare Pages

**Recommended:** do this in the Cloudflare dashboard (works for both production and preview deployments):

1. Go to **Cloudflare Dashboard → Pages → your site → Settings → Functions**
2. Under **D1 database bindings**, add:
   - Variable name: `DB`
   - D1 database: `cgm-portal-db`
3. Under **R2 bucket bindings**, add:
   - Variable name: `PORTAL_BUCKET`
   - R2 bucket: `cgm-portal-images`
4. Under **KV namespace bindings**, add:
   - Variable name: `PORTAL_KV`
   - KV namespace: the one you created in step 4

> Bindings set in the dashboard override anything in `wrangler.toml`, so you can skip step 7 if you do it this way.

### 7. (Alternative) Use wrangler.toml

If you prefer to keep config in git, copy `wrangler.toml.example` to `wrangler.toml`, fill in your `database_id` and KV `id`, and commit it. (The included `.gitignore` ignores `wrangler.toml` by default to keep IDs out of git — edit the `.gitignore` if you want to track it.)

### 8. Set environment variables (secrets)

In **Cloudflare Dashboard → Pages → your site → Settings → Environment variables**, add the following (for both Production and Preview):

| Variable | Value | Notes |
|---|---|---|
| `RESEND_API_KEY` | your existing Resend key | Already used by your booking form |
| `PORTAL_EMAIL_FROM` | `Chiltern Garden Maintenance <noreply@chilterngardenmaintenance.com>` | Sender address. Must be a verified sender in Resend. |
| `SITE_BASE_URL` | `https://www.chilterngardenmaintenance.com` | Used to build absolute magic-link URLs |
| `SESSION_SECRET` | (32+ char random hex) | Generate with `openssl rand -hex 32` |
| `MASTER_ADMIN_USER` | e.g. `cgm-admin` | Your admin login username |
| `MASTER_ADMIN_PASS` | `sha256:` + sha256 hash of your password | **Strongly recommended:** store as a hash, not plain text. See below. |

#### Hashing your admin password

```bash
echo -n "your-strong-password-here" | shasum -a 256
# outputs something like: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

Then set `MASTER_ADMIN_PASS` to `sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` (with the `sha256:` prefix).

If you don't hash it, you can also just set `MASTER_ADMIN_PASS` to your plain-text password and it will work — but hashing is much safer.

### 9. Trigger a redeploy

In Cloudflare Pages, hit **Retry deployment** on the latest commit (or push a new commit). The new bindings + env vars will take effect.

### 10. Create your first client

<<<<<<< Updated upstream
1. Visit `https://www.chilterngardenmaintenance.com/portal/admin/`
=======
1. Visit `https://www.chilterngardenmaintenance.com/chilterngardenmaintenance-updatedsite/portal/admin/`
>>>>>>> Stashed changes
2. Log in with your master admin credentials.
3. Click **+ New client**.
4. Fill in:
   - **Username** — what you'll give the client to log in (e.g. `smith-household`). Lowercase, hyphens only.
   - **Household name** — display name (e.g. `The Smith Household`).
   - **Email** — the client's email address (where magic links will be sent).
   - Address, service area, internal notes (optional).
5. Save.
6. Repeat for each client.

### 11. Tell your clients how to log in

Send each client a message like:

<<<<<<< Updated upstream
> Hi! You can now access your private client portal at chilterngardenmaintenance.com/login/. Your username is `smith-household`. Enter it and we'll email you a secure login link. The link expires in 15 minutes and can only be used once.
=======
> Hi! You can now access your private client portal at chilterngardenmaintenance.com/chilterngardenmaintenance-updatedsite/login/. Your username is `smith-household`. Enter it and we'll email you a secure login link. The link expires in 15 minutes and can only be used once.
>>>>>>> Stashed changes

From the admin dashboard, you can also click **Send login link** to email a magic link to a client on demand, or **Copy login URL** to copy a pre-filled login link to share via message.

---

## How the magic-link login works (security model)

<<<<<<< Updated upstream
1. Client enters their username on `/login/`.
2. Server looks up the client by username. If found, generates a 256-bit random token stored in D1 with a 15-minute expiry.
3. Server emails the client a link like `https://www.chilterngardenmaintenance.com/api/auth-verify?token=...` via Resend.
=======
1. Client enters their username on `/chilterngardenmaintenance-updatedsite/login/`.
2. Server looks up the client by username. If found, generates a 256-bit random token stored in D1 with a 15-minute expiry.
3. Server emails the client a link like `https://www.chilterngardenmaintenance.com/api/auth-verify?token=...` via Resend. (The API endpoint has no prefix — it lives at the repo root alongside your existing `quote.js`.)
>>>>>>> Stashed changes
4. Client clicks the link. Server verifies the token (must be unused + not expired), marks it used, creates a session row in D1, sets an HttpOnly + Secure + SameSite=Lax cookie containing `<sessionId>.<hmac>`.
5. The HMAC prevents tampering — even if an attacker steals the cookie value, they can't change the session ID without invalidating the signature.
6. All subsequent API requests check the cookie, verify the HMAC, look up the session in D1, and authorize based on `client_id` and `is_admin`.

**Privacy guarantees:**
- A client can only ever see their own data (the `client-data` endpoint filters by `session.client_id`).
- An admin can see any client's data, but admin sessions are tracked separately (`is_admin=1`).
- Images are served through `/api/client-image-get?id=...` which checks session ownership before reading from R2. There are no public image URLs.
- The dashboard "Send login link" button calls the same `/api/auth-request` endpoint — there's no admin backdoor that bypasses the magic-link flow.

---

## Day-to-day usage

### Posting an update to a client

<<<<<<< Updated upstream
1. Log in to `/portal/admin/`.
=======
1. Log in to `/chilterngardenmaintenance-updatedsite/portal/admin/`.
>>>>>>> Stashed changes
2. Click **Open portal** next to the client.
3. You're now viewing their household portal as an admin. Use the **Add a note** composer at the top.
4. Choose **Update note** (visible to client, sends email) or **Visit note** (records a visit, appears in the "Most recent visit" callout).
5. Optionally set a visit date.
6. Click **Post update**. The client receives an email notification.

### Uploading images to a client's portfolio

1. From the client's portal view (accessed via admin), use the **Image portfolio** upload zone on the right.
2. Drag & drop or click to select multiple images.
3. Add an optional caption (applies to all selected images in that batch).
4. Click **Upload images**.

### Viewing images a client has uploaded to you

Client-uploaded images appear in the same portfolio grid, tagged "Your upload" (from the client's perspective) or "Client upload" (from yours).

### Deleting an image (admin only)

Hover over an image in the portfolio grid and click the **×** button in the top-right corner. Confirms before deletion.

---

## Customising

### Branding

The portal uses your existing CSS variables from `css/styles.css` (`--forest`, `--gold`, `--serif`, etc.). To tweak portal-specific styling, edit `css/portal.css`.

### Path prefix

<<<<<<< Updated upstream
All asset URLs use the same `/chilterngardenmaintenance-updatedsite/` prefix as the rest of your site. If you ever change this prefix in your existing pages, also update the new portal pages (`login/index.html`, `portal/index.html`, `portal/admin/index.html`, `portal/admin/dashboard/index.html`, `portal/verify/index.html`).
=======
Your site uses two URL patterns (this matches your existing booking page):
- **Static assets & page links**: `/chilterngardenmaintenance-updatedsite/css/...`, `/chilterngardenmaintenance-updatedsite/login/`, etc. — WITH prefix (files live in the subfolder)
- **API endpoints**: `/api/auth-request`, `/api/client-data`, etc. — NO prefix (functions live at the repo root, same as your existing `/api/quote`)

If you ever change the `/chilterngardenmaintenance-updatedsite/` prefix in your existing pages, update these portal files too:
- `login/index.html`, `portal/index.html`, `portal/admin/index.html`, `portal/admin/dashboard/index.html`, `portal/verify/index.html` — page links
- `js/portal.js`, `js/portal-admin.js` — redirect URLs
- `functions/api/auth-verify.js` — redirect URLs
- `functions/api/auth-request.js` — `verifyPath` for magic link emails
- `functions/_lib/email.js` — "visit portal" link in notification emails
>>>>>>> Stashed changes

### Adding a "Get a Quote" CTA in the portal

The portal header already includes a **Sign out** button. To add another CTA, edit the `<header>` block in `portal/index.html`.

### Email templates

Email HTML lives in `functions/_lib/email.js`. Edit the `sendMagicLinkEmail` and `sendNewNoteEmail` functions to change wording or styling.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/auth-request` returns 500 | D1 binding `DB` not set | Add binding in Pages dashboard |
| Magic link email never arrives | `RESEND_API_KEY` not set, or sender address not verified in Resend | Verify the sender domain in Resend dashboard |
| Magic link click redirects to `/login/?error=invalid_token` | Token expired (>15 min), already used, or `SESSION_SECRET` changed between request and verify | Request a new link |
| Admin login always fails | `MASTER_ADMIN_USER` or `MASTER_ADMIN_PASS` not set, or password hash mismatch | Re-check env vars; if using sha256 prefix, ensure you hashed the password correctly |
| Image upload fails with "server_error" | `PORTAL_BUCKET` R2 binding not set | Add R2 binding in Pages dashboard |
| Images show broken in portal | Same as above, or D1 schema not applied | Re-run `wrangler d1 execute ... --file=db/schema.sql` |
| `/portal/` shows "Please sign in" even after clicking magic link | Cookie not set — usually because the site is being served over HTTP, not HTTPS | The cookie is `Secure`-only. Cloudflare Pages always serves HTTPS, so this should not happen in production. For local dev, see below. |

### Local development

To test locally with `wrangler pages dev`:

```bash
npx wrangler pages dev . --d1 DB=cgm-portal-db --r2 PORTAL_BUCKET=cgm-portal-images --kv PORTAL_KV
<<<<<<< Updated upstream
# then visit http://localhost:8788/login/
=======
# then visit http://localhost:8788/chilterngardenmaintenance-updatedsite/login/
>>>>>>> Stashed changes
```

For local dev, you may want to set `SESSION_SECRET` to a dev value and temporarily disable the `Secure` cookie flag (search for `'Secure'` in `functions/_lib/auth.js` and replace with `''`).

---

## Backup

To back up client data:

```bash
npx wrangler d1 export cgm-portal-db --remote --output=backup-$(date +%Y%m%d).sql
```

For images, sync the R2 bucket to a local folder periodically:

```bash
npx wrangler r2 object list cgm-portal-images/clients/ > image-keys.txt
# (then loop and download each — see Wrangler R2 docs)
```

---

## Need help?

This is a self-contained module — no external services beyond Cloudflare + Resend (both of which you already use). All code is in the repo and can be modified freely.

The most common gotcha is forgetting to add the **D1 / R2 / KV bindings** in the Cloudflare Pages dashboard after the first deploy — that step is what makes the API functions actually work.
