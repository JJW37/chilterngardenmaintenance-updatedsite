import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import { createSession, COOKIE_NAME } from '../functions/_lib/auth.js';
import { onRequestPost as visitPost } from '../functions/api/client-visits.js';
import { onRequestPost as feedbackPost } from '../functions/api/client-feedback.js';
import { onRequestGet as messageGet, onRequestPost as messagePost } from '../functions/api/client-messages.js';
import { onRequestPost as invoiceActionPost } from '../functions/api/client-invoice-action.js';
import { onRequestGet as clientDataGet } from '../functions/api/client-data.js';

class D1MemoryDatabase {
  constructor() { this.database = new DatabaseSync(':memory:'); }

  exec(sql) { this.database.exec(sql); }

  prepare(sql) {
    const statement = this.database.prepare(sql);
    return {
      bind(...params) {
        return {
          async run() {
            const result = statement.run(...params);
            return { meta: { changes: Number(result.changes || 0), last_row_id: Number(result.lastInsertRowid || 0) } };
          },
          async all() { return { results: statement.all(...params) }; },
          async first() { return statement.get(...params) || null; },
        };
      },
    };
  }
}

function request(url, cookieValue, payload) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `${COOKIE_NAME}=${cookieValue}` },
    body: JSON.stringify(payload),
  });
}

test('the redesigned portal workflow persists visits, feedback, messages and payment signals', async () => {
  const db = new D1MemoryDatabase();
  db.exec(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await db.prepare(`INSERT INTO clients (username, household_name, email, is_active) VALUES (?, ?, ?, 1)`)
    .bind('workflow-household', 'The Workflow Household', 'workflow@example.test').run();
  const env = {
    DB: db,
    SESSION_SECRET: 'local-test-session-secret-with-at-least-thirty-two-characters',
  };
  const adminSession = await createSession(db, env, { isAdmin: true });
  const clientSession = await createSession(db, env, { clientId: 1 });

  const createVisit = await visitPost({
    request: request('http://portal.test/api/client-visits', adminSession.cookieValue, {
      action: 'create', clientId: 1, scheduledStart: '2026-09-21T09:30', arrivalWindow: '09:00–11:00',
      gardenerName: 'CGM team', tasks: [{ title: 'Shape hedge', area: 'Front garden' }],
    }),
    env,
  });
  assert.equal(createVisit.status, 201);
  const visitId = (await createVisit.json()).id;

  const confirm = await visitPost({
    request: request('http://portal.test/api/client-visits', clientSession.cookieValue, { action: 'confirm', visitId }), env,
  });
  assert.equal((await confirm.json()).status, 'confirmed');

  const complete = await visitPost({
    request: request('http://portal.test/api/client-visits', adminSession.cookieValue, { action: 'update', clientId: 1, visitId, status: 'completed', summary: 'Hedge shaped and paths cleared.' }), env,
  });
  assert.equal((await complete.json()).ok, true);

  const feedback = await feedbackPost({
    request: request('http://portal.test/api/client-feedback', clientSession.cookieValue, { visitId, rating: 5, tags: ['Punctual', 'Tidy finish'], comment: 'Thank you.' }), env,
  });
  assert.equal((await feedback.json()).ok, true);

  const sendMessage = await messagePost({
    request: request('http://portal.test/api/client-messages', clientSession.cookieValue, { body: 'Could we discuss the autumn plan?', visitId }), env,
  });
  assert.equal(sendMessage.status, 201);
  const adminMessages = await messageGet({
    request: new Request('http://portal.test/api/client-messages?clientId=1', { headers: { Cookie: `${COOKIE_NAME}=${adminSession.cookieValue}` } }), env,
  });
  const thread = await adminMessages.json();
  assert.equal(thread.messages.length, 1);
  assert.ok(thread.messages[0].recipientReadAt, 'opening the staff thread records a read receipt');

  await db.prepare(`INSERT INTO invoices (client_id, invoice_number, status, issue_date, due_date, total, amount_paid) VALUES (?, ?, 'sent', ?, ?, ?, 0)`)
    .bind(1, 'CGM-2026-9999', '2026-09-01', '2026-09-30', 120).run();
  const paymentSignal = await invoiceActionPost({
    request: request('http://portal.test/api/client-invoice-action', clientSession.cookieValue, { invoiceId: 1, intentType: 'bank_transfer_notified', amount: 120 }), env,
  });
  const paymentBody = await paymentSignal.json();
  assert.equal(paymentBody.ok, true);
  assert.match(paymentBody.message, /remains outstanding/i);

  const clientData = await clientDataGet({
    request: new Request('http://portal.test/api/client-data', { headers: { Cookie: `${COOKIE_NAME}=${clientSession.cookieValue}` } }), env,
  });
  const data = await clientData.json();
  assert.equal(data.visits[0].status, 'completed');
  assert.equal(data.visits[0].feedback.rating, 5);
  assert.equal(data.outstandingInvoices[0].invoiceNumber, 'CGM-2026-9999');
});
