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
--   invoices      - private client invoices and payment state
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Clients
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT    NOT NULL UNIQUE,                  -- e.g. "smith-household"
  household_name  TEXT    NOT NULL,                          -- e.g. "The Smith Household"
  email           TEXT    NOT NULL,
  password_hash   TEXT,                                     -- salted PBKDF2 hash; never a plaintext password
  password_updated_at TEXT,
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
  visit_id        INTEGER,
  area            TEXT,
  tags_json       TEXT    NOT NULL DEFAULT '[]',
  comparison_key  TEXT,
  taken_at        TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_images_client   ON images(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(client_id, category);
CREATE INDEX IF NOT EXISTS idx_images_visit    ON images(client_id, visit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_area     ON images(client_id, area);
CREATE INDEX IF NOT EXISTS idx_images_comparison ON images(client_id, comparison_key);

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
-- Garden-plan items (private seasonal direction for an individual household)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS garden_plan_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id       INTEGER NOT NULL,
  season          TEXT    NOT NULL DEFAULT 'All year',
  title           TEXT    NOT NULL,
  detail          TEXT,
  status          TEXT    NOT NULL DEFAULT 'planned'
                          CHECK(status IN ('planned', 'in_progress', 'complete')),
  priority        TEXT    NOT NULL DEFAULT 'recommended'
                          CHECK(priority IN ('essential', 'recommended', 'optional')),
  target_date     TEXT,
  area            TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plan_items_client ON garden_plan_items(client_id, status, target_date);
CREATE INDEX IF NOT EXISTS idx_plan_items_area ON garden_plan_items(client_id, area, status);

-- -----------------------------------------------------------------------------
-- Visits, work lists and feedback (redesigned portal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visits (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id       INTEGER NOT NULL,
  scheduled_start TEXT    NOT NULL,
  arrival_window  TEXT,
  gardener_name   TEXT,
  status          TEXT    NOT NULL DEFAULT 'scheduled'
                          CHECK(status IN ('scheduled','confirmed','reschedule_requested','completed','cancelled')),
  summary         TEXT,
  completed_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_visits_client_schedule ON visits(client_id, scheduled_start, status);

CREATE TABLE IF NOT EXISTS visit_tasks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id        INTEGER NOT NULL,
  client_id       INTEGER NOT NULL,
  plan_item_id    INTEGER,
  title           TEXT    NOT NULL,
  detail          TEXT,
  area            TEXT,
  status          TEXT    NOT NULL DEFAULT 'planned'
                          CHECK(status IN ('planned','in_progress','complete','flagged')),
  priority        TEXT    NOT NULL DEFAULT 'recommended'
                          CHECK(priority IN ('essential','recommended','optional')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  completed_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_item_id) REFERENCES garden_plan_items(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_visit ON visit_tasks(visit_id, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_client ON visit_tasks(client_id, status);

CREATE TABLE IF NOT EXISTS visit_feedback (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id       INTEGER NOT NULL,
  visit_id        INTEGER NOT NULL UNIQUE,
  rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  tags_json       TEXT    NOT NULL DEFAULT '[]',
  comment         TEXT,
  submitted_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_client ON visit_feedback(client_id, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- Invoices, invoice items, payments and bank transfer details
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id       INTEGER NOT NULL,
  invoice_number  TEXT    NOT NULL UNIQUE,
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','partial','overdue','cancelled')),
  issue_date      TEXT    NOT NULL DEFAULT (date('now')),
  due_date        TEXT    NOT NULL,
  payment_terms   TEXT    NOT NULL DEFAULT 'On receipt',
  reference       TEXT,
  subtotal        REAL    NOT NULL DEFAULT 0,
  vat_rate        REAL    NOT NULL DEFAULT 0,
  vat_amount      REAL    NOT NULL DEFAULT 0,
  total           REAL    NOT NULL DEFAULT 0,
  amount_paid     REAL    NOT NULL DEFAULT 0,
  currency        TEXT    NOT NULL DEFAULT 'GBP',
  notes           TEXT,
  r2_key          TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1, unit_price REAL NOT NULL DEFAULT 0, line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT 'maintenance',
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_invoice_items_category ON invoice_items(invoice_id, category);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, client_id INTEGER NOT NULL,
  amount REAL NOT NULL, payment_method TEXT NOT NULL DEFAULT 'bank_transfer'
  CHECK(payment_method IN ('bank_transfer','cash','cheque','card','other')), payment_ref TEXT,
  paid_date TEXT NOT NULL DEFAULT (date('now')), confirmed_by TEXT, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id, paid_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id, paid_date DESC);

CREATE TABLE IF NOT EXISTS bank_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL DEFAULT 'Main account', account_name TEXT NOT NULL,
  sort_code TEXT NOT NULL, account_number TEXT NOT NULL, bank_name TEXT, is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bank_details_active ON bank_details(is_active);

-- -----------------------------------------------------------------------------
-- Two-way messages and payment-intent records (redesigned portal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal_messages (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id           INTEGER NOT NULL,
  sender_type         TEXT    NOT NULL CHECK(sender_type IN ('admin','client')),
  sender_name         TEXT    NOT NULL,
  body                TEXT    NOT NULL,
  visit_id            INTEGER,
  invoice_id          INTEGER,
  attachment_image_id INTEGER,
  recipient_read_at   TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (attachment_image_id) REFERENCES images(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_messages_client ON portal_messages(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_messages_unread ON portal_messages(client_id, sender_type, recipient_read_at);

CREATE TABLE IF NOT EXISTS invoice_payment_intents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id      INTEGER NOT NULL,
  client_id       INTEGER NOT NULL,
  intent_type     TEXT    NOT NULL CHECK(intent_type IN ('bank_transfer_notified','payment_plan_request')),
  amount          REAL,
  proposed_date   TEXT,
  note            TEXT,
  status          TEXT    NOT NULL DEFAULT 'requested'
                          CHECK(status IN ('requested','acknowledged','cancelled')),
  created_by      TEXT    NOT NULL CHECK(created_by IN ('client','admin')),
  resolved_at     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payment_intents_invoice ON invoice_payment_intents(invoice_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_client ON invoice_payment_intents(client_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Optional: seed an example client (REPLACE with real client later)
-- -----------------------------------------------------------------------------
-- INSERT INTO clients (username, household_name, email, address_line, service_area)
-- VALUES ('smith-household', 'The Smith Household', 'smith@example.com', '12 Acacia Avenue, Oxford', 'Oxfordshire');
