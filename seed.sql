-- Safe demonstration data only. This script contains no real client data.
INSERT OR IGNORE INTO clients (
  username, household_name, email, password_hash, password_updated_at,
  address_line, service_area, notes_internal
) VALUES (
  'hawthorn-household',
  'The Hawthorn Household',
  'demo@example.test',
  'pbkdf2_sha256$600000$80eeaebc1d334d4c958fed4a13653ed3$1041c8f74e33dd72cf1f01e85609decf27ebd69cae8ef65ef62f718fc33311d2',
  datetime('now'),
  '12 Example Lane',
  'Oxfordshire',
  'Development-only sample record'
);

INSERT OR IGNORE INTO garden_plan_items (
  client_id, season, title, detail, status, priority, target_date
) VALUES
(
  (SELECT id FROM clients WHERE username = 'hawthorn-household'),
  'Late summer',
  'Condition the border soil',
  'Continue the mulch programme and assess moisture retention before autumn planting.',
  'in_progress', 'essential', '2026-09-15'
),
(
  (SELECT id FROM clients WHERE username = 'hawthorn-household'),
  'Autumn',
  'Review hedge line and structure',
  'Confirm the winter structure, remove weak growth and plan any replacement planting.',
  'planned', 'recommended', '2026-10-20'
);

INSERT OR IGNORE INTO notes (
  client_id, author_type, author_name, note_type, visit_date, title, body, pinned
) VALUES (
  (SELECT id FROM clients WHERE username = 'hawthorn-household'),
  'admin',
  'Chiltern Garden Maintenance',
  'visit',
  '2026-08-07',
  'Summer progress visit',
  'Demonstration visit note: the borders were weeded, the hedge line was checked, and the next focus is soil conditioning before autumn planting.',
  1
);
