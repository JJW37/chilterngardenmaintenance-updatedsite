-- =============================================================================
-- CGM Client Portal - D1 Database Schema
-- =============================================================================
-- Apply with:
--   wrangler d1 execute cgm-portal-db --remote --file=db/schema.sql
--   (or --local for local dev)
--
-- Tables:
--   clients       - one row per household (admin creates these)
--   notes         - admin & client notes (progress notes, history, updates)
--   images        - 1:1 portfolio image metadata (file lives in R2)
--   magic_tokens  - one-time magic-link login tokens
--   sessions      - active session cookies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Clients
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT    NOT NULL UNIQUE,                  -- e.g. "smith-household"
  household_name  TEXT    NOT NULL,                          -- e.g. "The Smith Household"
  email           TEXT    NOT NULL,
  address_line    TEXT,                                     -- optional property address
  service_area    TEXT,                                     -- e.g. "Oxfordshire"
  notes_internal  TEXT,                                     -- private admin-only notes (not visible to client)
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_username ON clients(username);
CREATE INDEX IF NOT EXISTS idx_clients_email    ON clients(email);

-- -----------------------------------------------------------------------------
-- Notes (progress notes, history, updates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id       INTEGER NOT NULL,
  author_type     TEXT    NOT NULL CHECK(author_type IN ('admin','client')),
  author_name     TEXT,                                     -- e.g. "CGM" or "Sarah Smith"
  note_type       TEXT    NOT NULL DEFAULT 'update',         -- 'visit' | 'update' | 'client_note'
  visit_date      TEXT,                                     -- date of visit (for visit notes)
  title           TEXT,                                     -- optional short title
  body            TEXT    NOT NULL,
  pinned          INTEGER NOT NULL DEFAULT 0,                -- admin can pin a note to top
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_client      ON notes(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_visit_date  ON notes(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned      ON notes(client_id, pinned DESC);

-- -----------------------------------------------------------------------------
-- Images (1:1 portfolio)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS images (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id       INTEGER NOT NULL,
  uploader_type   TEXT    NOT NULL CHECK(uploader_type IN ('admin','client')),
  uploader_name   TEXT,
  r2_key          TEXT    NOT NULL,                          -- R2 object key
  filename        TEXT    NOT NULL,                          -- original filename
  mime_type       TEXT    NOT NULL,
  size_bytes      INTEGER NOT NULL,
  caption         TEXT,
  category        TEXT    NOT NULL DEFAULT 'progress',       -- 'progress' | 'before_after' | 'reference' | 'client_upload'
  visit_date      TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_client   ON images(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(client_id, category);

-- -----------------------------------------------------------------------------
-- Magic-link login tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS magic_tokens (
  token           TEXT    PRIMARY KEY,
  client_id       INTEGER NOT NULL,
  expires_at      TEXT    NOT NULL,
  used            INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_magic_tokens_client ON magic_tokens(client_id);

-- -----------------------------------------------------------------------------
-- Sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id      TEXT    PRIMARY KEY,
  client_id       INTEGER,                                  -- NULL for admin sessions
  is_admin        INTEGER NOT NULL DEFAULT 0,
  ip_address      TEXT,
  user_agent      TEXT,
  expires_at      TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_admin  ON sessions(is_admin);

-- -----------------------------------------------------------------------------
-- Optional: seed an example client (REPLACE with real client later)
-- -----------------------------------------------------------------------------
-- INSERT INTO clients (username, household_name, email, address_line, service_area)
-- VALUES ('smith-household', 'The Smith Household', 'smith@example.com', '12 Acacia Avenue, Oxford', 'Oxfordshire');
