-- Alias retained for a direct D1 apply. The canonical tracked migration is
-- migrations/0003-invoices.sql.
--
-- wrangler d1 execute cgm-portal-preview-db --remote --file=migrations/0003-invoices.sql

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','partial','overdue','cancelled')),
  issue_date TEXT NOT NULL DEFAULT (date('now')), due_date TEXT NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT 'On receipt', reference TEXT,
  subtotal REAL NOT NULL DEFAULT 0, vat_rate REAL NOT NULL DEFAULT 0, vat_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0, amount_paid REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'GBP',
  notes TEXT, r2_key TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1, unit_price REAL NOT NULL DEFAULT 0, line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id, sort_order);

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
