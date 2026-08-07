╔══════════════════════════════════════════════════════════════════════════════╗
║      YOUR COMPLETE SITE + CLIENT PORTAL — GIT REPOSITORY READY TO PUSH         ║
╚══════════════════════════════════════════════════════════════════════════════╝

This folder is ALREADY a git repository. The hidden ".git" subfolder is
included, so GitHub Desktop will recognize it immediately.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Unzip this folder
━━━━━━━━━━━━━━━━━━━━━━━━━

  Right-click the zip → "Extract All..." → choose a permanent location
  like:  C:\Users\jww11\Documents\chilterngardenmaintenance-updatedsite\

  (Don't keep it in Downloads — move it somewhere permanent.)


STEP 2: Open it in GitHub Desktop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  a. Open GitHub Desktop.
  b. Top-left menu → File → "Add local repository..."
  c. Click "Choose..." and select the unzipped folder.
  d. GitHub Desktop will recognize it as a git repository (because .git
     is inside). It will show: "Chiltern Garden Maintenance website
     with client portal" as the latest commit.
  e. Click "Add repository".


STEP 3: Connect it to your existing GitHub repo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The folder currently has a PLACEHOLDER remote URL that you need to
  replace with your actual GitHub repo URL.

  a. In GitHub Desktop, top menu → Repository → "Repository settings..."
  b. In the "Remote URL" field, you'll see:
        https://github.com/USERNAME/chilterngardenmaintenance-updatedsite.git
  c. Replace "USERNAME" with your actual GitHub username.
     (To find your exact URL: open your repo on github.com in a browser,
      click the green "Code" button, copy the HTTPS URL.)
  d. Click "Save".


STEP 4: Push to GitHub
━━━━━━━━━━━━━━━━━━━━━━

  Because this repo has its own commit history, you need to do a "force
  push" the first time. This will OVERWRITE your GitHub repo's history
  with the contents of this folder.

  OPTION A — Safe (recommended): just push as a NEW branch
  ───────────────────────────────────────────────────────
  1. In GitHub Desktop, top menu → Branch → "Rename..."
  2. Rename "main" to "portal-launch" (or any name you like).
  3. Click "Publish repository" (top right).
  4. On GitHub, you can then open a Pull Request to merge "portal-launch"
     into "main" if you want to review the changes first.

  OPTION B — Replace the main branch entirely (force push)
  ────────────────────────────────────────────────────────
  Only do this if you're sure you want to overwrite your GitHub repo's
  current contents. From a terminal (Command Prompt or PowerShell):

     cd "C:\Users\jww11\Documents\chilterngardenmaintenance-updatedsite"
     git push -u origin main --force

  Or in GitHub Desktop: use the "Push" button; if it errors, click
  "Fetch origin" first, then try pushing again. If it still errors
  about non-fast-forward, use Option B above with the terminal command.


STEP 5: Set up Cloudflare (D1 + R2 + env vars)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Full instructions in README-PORTAL.md. Quick summary:

  a. Install Node.js + wrangler if not already:
        npm install -g wrangler
  b. Run:  wrangler login
  c. Create the database, bucket, and KV namespace:
        wrangler d1 create cgm-portal-db
        wrangler r2 bucket create cgm-portal-images
        wrangler kv namespace create PORTAL_KV
  d. Apply the schema:
        wrangler d1 execute cgm-portal-db --remote --file=db/schema.sql
  e. In Cloudflare Pages dashboard → your site → Settings → Functions →
     Bindings, add:
        - D1 binding:  DB → cgm-portal-db
        - R2 binding:  PORTAL_BUCKET → cgm-portal-images
        - KV binding:  PORTAL_KV → (your namespace)
  f. In Cloudflare Pages dashboard → Settings → Environment variables,
     add (for both Production and Preview):
        - RESEND_API_KEY        (you already have this)
        - PORTAL_EMAIL_FROM     "Chiltern Garden Maintenance <noreply@chilterngardenmaintenance.com>"
        - SITE_BASE_URL         "https://www.chilterngardenmaintenance.com"
        - SESSION_SECRET        (generate with: openssl rand -hex 32)
        - MASTER_ADMIN_USER     your admin username
        - MASTER_ADMIN_PASS     "sha256:" + hash of your password (see README-PORTAL.md)
  g. In Cloudflare Pages, hit "Retry deployment" on the latest deploy.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URLS ONCE LIVE:

  Client login:    https://www.chilterngardenmaintenance.com/chilterngardenmaintenance-updatedsite/login/
  Admin login:     https://www.chilterngardenmaintenance.com/chilterngardenmaintenance-updatedsite/portal/admin/


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY DID GITHUB DESKTOP SAY "AREN'T GIT REPOSITORIES" BEFORE?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A folder only becomes a "git repository" when it has a hidden ".git"
subfolder inside it. My earlier zips didn't include that, so GitHub
Desktop didn't recognize them. This zip INCLUDES the .git folder, so
GitHub Desktop will recognize it immediately when you "Add local
repository".

If you previously tried to add my old zip folder and got the error,
just delete that old folder and start fresh with this zip.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
