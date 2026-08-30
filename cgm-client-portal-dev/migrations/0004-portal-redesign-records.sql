-- CGM Client Portal: operational records for the redesigned private portal.
--
-- Apply this migration before publishing the redesigned portal bundle. It is
-- deliberately additive: existing client, note, plan, image and invoice data
-- remains intact and continues to be visible in the new experience.

-- Scheduled and completed visits are separate from the legacy note stream so
-- a household can confirm an upcoming visit, see its work list and leave
-- feedback without changing historical notes.
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

-- A persistent two-way conversation. `recipient_read_at` is a read receipt,
-- not an email-delivery claim. Attachments point to the already authenticated
-- image proxy rather than exposing R2 object keys.
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

-- A client can signal that a bank transfer has been made or ask CGM to
-- discuss a payment plan. These records never create a bank transfer or mark
-- an invoice paid; staff must still record a received payment separately.
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

-- Metadata makes the photo timeline, filtered garden areas and genuine
-- before/after comparisons possible. No public property map is stored.
ALTER TABLE images ADD COLUMN visit_id INTEGER;
ALTER TABLE images ADD COLUMN area TEXT;
ALTER TABLE images ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE images ADD COLUMN comparison_key TEXT;
ALTER TABLE images ADD COLUMN taken_at TEXT;
CREATE INDEX IF NOT EXISTS idx_images_visit ON images(client_id, visit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_area ON images(client_id, area);
CREATE INDEX IF NOT EXISTS idx_images_comparison ON images(client_id, comparison_key);

ALTER TABLE garden_plan_items ADD COLUMN area TEXT;
CREATE INDEX IF NOT EXISTS idx_plan_items_area ON garden_plan_items(client_id, area, status);

-- Existing invoice lines are maintenance by default. New invoices can record
-- a category, enabling a truthful service/materials/project spend breakdown.
ALTER TABLE invoice_items ADD COLUMN category TEXT NOT NULL DEFAULT 'maintenance';
CREATE INDEX IF NOT EXISTS idx_invoice_items_category ON invoice_items(invoice_id, category);
