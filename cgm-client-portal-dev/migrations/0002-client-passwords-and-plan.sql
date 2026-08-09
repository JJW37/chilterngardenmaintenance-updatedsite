-- Apply once to an existing portal D1 database after db/schema.sql has already
-- created the original tables. Fresh installations receive these columns from
-- db/schema.sql directly.
ALTER TABLE clients ADD COLUMN password_hash TEXT;
ALTER TABLE clients ADD COLUMN password_updated_at TEXT;

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
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plan_items_client ON garden_plan_items(client_id, status, target_date);
