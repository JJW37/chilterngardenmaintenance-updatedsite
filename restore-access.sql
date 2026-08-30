-- =============================================================================
-- CGM PORTAL — RESTORE LOGIN ACCESS (household/user accounts)
-- =============================================================================
-- Purpose: (re)create household client accounts with a known password so the
-- owner can sign in again at /login/ immediately.
--
-- HOW TO RUN (choose one):
--   A) Cloudflare dashboard -> Storage & Databases -> D1 -> cgm-portal-preview-db
--      -> Console -> paste this file's contents -> Run
--   B) Terminal:  npx wrangler d1 execute cgm-portal-preview-db --remote --file=db/restore-access.sql
--      (use the database name shown in your Cloudflare dashboard)
--
-- Passwords below are TEMPORARY. Change each one after first login from
-- Portal -> Household account -> Change password (min 12 characters).
--
-- Hash format: pbkdf2_sha256$<iterations>$<salt-hex>$<hash-hex>
-- (generated with the repo's own scripts/hash-password.mjs)
--
-- To set a DIFFERENT password than the temporary one, generate a new hash:
--   cd cgm-client-portal-dev && printf '%s' 'YourNewPassword' | npm run password:hash
-- and paste the output into password_hash below.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Account 1 — owner/household login
-- Username: chilterns-household     Temporary password: CGM-Home-2026!
-- -----------------------------------------------------------------------------
INSERT INTO clients (
  username, household_name, email, password_hash, password_updated_at,
  address_line, service_area, notes_internal, is_active
) VALUES (
  'chilterns-household',
  'Chilterns Household',
  'owner@chilterngardenmaintenance.com',
  'pbkdf2_sha256$60000$a4790fe379f90f16adc38a554bcb1b0b$eecc9f932b611cca7053dc03ca191cce4ddc455b9413501de43c4e41347ae4be',
  datetime('now'),
  '',
  'Oxfordshire',
  'Owner account — restored access',
  1
)
ON CONFLICT(username) DO UPDATE SET
  password_hash = excluded.password_hash,
  password_updated_at = datetime('now'),
  is_active = 1;

-- -----------------------------------------------------------------------------
-- Account 2 — example household template (edit values before running if wanted)
-- Username: smith-household         Temporary password: CGM-Home-2026!
-- -----------------------------------------------------------------------------
INSERT INTO clients (
  username, household_name, email, password_hash, password_updated_at,
  address_line, service_area, notes_internal, is_active
) VALUES (
  'smith-household',
  'The Smith Household',
  'smith@example.com',
  'pbkdf2_sha256$60000$a4790fe379f90f16adc38a554bcb1b0b$eecc9f932b611cca7053dc03ca191cce4ddc455b9413501de43c4e41347ae4be',
  datetime('now'),
  '',
  'Buckinghamshire',
  'Template household — edit details',
  1
)
ON CONFLICT(username) DO UPDATE SET
  password_hash = excluded.password_hash,
  password_updated_at = datetime('now'),
  is_active = 1;

-- -----------------------------------------------------------------------------
-- Verify (run in the same console afterwards):
--   SELECT id, username, household_name, is_active,
--          password_hash IS NOT NULL AS has_password
--   FROM clients ORDER BY id;
-- Every row you want to log in with should show has_password = 1 and
-- is_active = 1.
-- -----------------------------------------------------------------------------
