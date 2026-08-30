/**
 * GET  /api/admin-invoices[?id=&clientId=&status=]
 * POST /api/admin-invoices — records payments, cancels invoices, saves bank details.
 */

import { all, first, json, handlePreflight, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { invoiceStatusForPayment, roundMoney, validIsoDate } from '../_lib/invoices.js';
import { sendPaymentRecordedEmail } from '../_lib/email.js';

const PAYMENT_METHODS = new Set(['bank_transfer', 'cash', 'cheque', 'card', 'other']);

async function requireAdmin(request, env) {
  const session = await getSessionFromRequest(env.DB, env, request);
  return session?.is_admin === 1 ? session : null;
}

async function refreshOverdueInvoices(db) {
  await run(
    db,
    `UPDATE invoices SET status = 'overdue', updated_at = datetime('now')
     WHERE status IN ('sent', 'partial') AND due_date < date('now')`,
  );
}

function mapInvoice(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paymentTerms: row.payment_terms,
    reference: row.reference,
    subtotal: row.subtotal,
    vatRate: row.vat_rate,
    vatAmount: row.vat_amount,
    total: row.total,
    amountPaid: row.amount_paid,
    balanceDue: roundMoney(row.total - row.amount_paid),
    notes: row.notes,
    hasPdf: Boolean(row.r2_key),
    clientName: row.household_name,
    clientEmail: row.email,
    clientAddress: row.address_line,
    clientServiceArea: row.service_area,
    createdAt: row.created_at,
  };
}

function mapPaymentIntent(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    clientId: row.client_id,
    intentType: row.intent_type,
    amount: row.amount,
    proposedDate: row.proposed_date,
    note: row.note,
    status: row.status,
    createdBy: row.created_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    if (!(await requireAdmin(request, env))) return json({ ok: false, error: 'forbidden' }, 403);
    await refreshOverdueInvoices(env.DB);
    const url = new URL(request.url);
    const invoiceId = Number.parseInt(url.searchParams.get('id'), 10);

    if (Number.isSafeInteger(invoiceId) && invoiceId > 0) {
      const invoice = await first(env.DB, `SELECT i.*, c.household_name, c.email, c.address_line, c.service_area FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?`, [invoiceId]);
      if (!invoice) return json({ ok: false, error: 'Invoice not found.' }, 404);
      const [items, payments, bank, paymentIntents] = await Promise.all([
        all(env.DB, `SELECT id, description, quantity, unit_price, line_total, sort_order, category FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, id`, [invoiceId]),
        all(env.DB, `SELECT id, amount, payment_method, payment_ref, paid_date, confirmed_by, notes FROM payments WHERE invoice_id = ? ORDER BY paid_date DESC, id DESC`, [invoiceId]),
        first(env.DB, `SELECT label, account_name, sort_code, account_number, bank_name FROM bank_details WHERE is_active = 1 ORDER BY id DESC LIMIT 1`),
        all(env.DB, `SELECT id, invoice_id, client_id, intent_type, amount, proposed_date, note, status, created_by, resolved_at, created_at FROM invoice_payment_intents WHERE invoice_id = ? ORDER BY CASE status WHEN 'requested' THEN 0 ELSE 1 END, created_at DESC, id DESC`, [invoiceId]),
      ]);
      return json({ ok: true, invoice: mapInvoice(invoice), items, payments, paymentIntents: paymentIntents.map(mapPaymentIntent), bankDetails: bank });
    }

    const clientId = Number.parseInt(url.searchParams.get('clientId'), 10);
    const status = String(url.searchParams.get('status') || '').trim();
    const params = [];
    let sql = `SELECT i.*, c.household_name, c.email, c.address_line, c.service_area FROM invoices i JOIN clients c ON c.id = i.client_id WHERE 1=1`;
    if (Number.isSafeInteger(clientId) && clientId > 0) { sql += ' AND i.client_id = ?'; params.push(clientId); }
    if (['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'].includes(status)) { sql += ' AND i.status = ?'; params.push(status); }
    sql += ' ORDER BY i.issue_date DESC, i.id DESC';
    const invoices = await all(env.DB, sql, params);
    const bank = await first(env.DB, `SELECT label, account_name, sort_code, account_number, bank_name FROM bank_details WHERE is_active = 1 ORDER BY id DESC LIMIT 1`);
    return json({ ok: true, invoices: invoices.map(mapInvoice), bankDetails: bank });
  } catch (error) {
    console.error(JSON.stringify({ event: 'admin_invoices_get_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to load invoices.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    if (!(await requireAdmin(request, env))) return json({ ok: false, error: 'forbidden' }, 403);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim();

    if (action === 'record-payment') {
      const invoiceId = Number.parseInt(body.invoiceId, 10);
      const amount = roundMoney(body.amount);
      const method = String(body.paymentMethod || 'bank_transfer');
      const paidDate = String(body.paidDate || new Date().toISOString().slice(0, 10));
      const reference = String(body.paymentReference || '').trim();
      const notes = String(body.notes || '').trim();
      if (!Number.isSafeInteger(invoiceId) || invoiceId < 1 || !Number.isFinite(amount) || amount <= 0) {
        return json({ ok: false, error: 'Choose an invoice and enter a valid payment amount.' }, 400);
      }
      if (!PAYMENT_METHODS.has(method) || !validIsoDate(paidDate) || reference.length > 160 || notes.length > 4000) {
        return json({ ok: false, error: 'One or more payment fields are invalid.' }, 400);
      }
      const invoice = await first(env.DB, `SELECT i.*, c.household_name, c.email, c.address_line, c.service_area FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?`, [invoiceId]);
      if (!invoice) return json({ ok: false, error: 'Invoice not found.' }, 404);
      if (['paid', 'cancelled'].includes(invoice.status)) return json({ ok: false, error: 'This invoice cannot receive another payment.' }, 409);
      const balance = roundMoney(invoice.total - invoice.amount_paid);
      if (amount > balance) return json({ ok: false, error: `Payment cannot exceed the outstanding balance of £${balance.toFixed(2)}.` }, 400);
      const newAmountPaid = roundMoney(Number(invoice.amount_paid) + amount);
      const newStatus = invoiceStatusForPayment(invoice.total, newAmountPaid);
      await run(env.DB, `INSERT INTO payments (invoice_id, client_id, amount, payment_method, payment_ref, paid_date, confirmed_by, notes) VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)`, [invoiceId, invoice.client_id, amount, method, reference || null, paidDate, notes || null]);
      await run(env.DB, `UPDATE invoices SET amount_paid = ?, status = ?, updated_at = datetime('now') WHERE id = ?`, [newAmountPaid, newStatus, invoiceId]);
      // Email is deliberately optional; no notification is sent without the configured accounts address.
      await sendPaymentRecordedEmail({ invoiceNumber: invoice.invoice_number, householdName: invoice.household_name, amount, total: invoice.total, amountPaid: newAmountPaid, status: newStatus }, env);
      return json({ ok: true, invoiceId, status: newStatus, amountPaid: newAmountPaid });
    }

    if (action === 'cancel') {
      const invoiceId = Number.parseInt(body.invoiceId, 10);
      const invoice = await first(env.DB, `SELECT id, amount_paid, status FROM invoices WHERE id = ?`, [invoiceId]);
      if (!invoice) return json({ ok: false, error: 'Invoice not found.' }, 404);
      if (invoice.amount_paid > 0) return json({ ok: false, error: 'An invoice with recorded payments cannot be cancelled.' }, 409);
      if (invoice.status === 'paid') return json({ ok: false, error: 'A paid invoice cannot be cancelled.' }, 409);
      await run(env.DB, `UPDATE invoices SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`, [invoiceId]);
      return json({ ok: true });
    }

    if (action === 'resolve-payment-intent') {
      const intentId = Number.parseInt(body.intentId, 10);
      const status = String(body.status || '').trim();
      if (!Number.isSafeInteger(intentId) || intentId < 1 || !['acknowledged', 'cancelled'].includes(status)) {
        return json({ ok: false, error: 'Choose a valid client payment signal and status.' }, 400);
      }
      const intent = await first(env.DB, 'SELECT id FROM invoice_payment_intents WHERE id = ?', [intentId]);
      if (!intent) return json({ ok: false, error: 'Payment signal not found.' }, 404);
      await run(env.DB, `UPDATE invoice_payment_intents SET status = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`, [status, intentId]);
      return json({ ok: true });
    }

    if (action === 'save-bank-details') {
      const label = String(body.label || 'Main account').trim().slice(0, 80) || 'Main account';
      const accountName = String(body.accountName || '').trim().slice(0, 160);
      const sortCode = String(body.sortCode || '').trim().replace(/\s/g, '');
      const accountNumber = String(body.accountNumber || '').trim().replace(/\s/g, '');
      const bankName = String(body.bankName || '').trim().slice(0, 120);
      if (!accountName || !/^\d{2}-?\d{2}-?\d{2}$/.test(sortCode) || !/^\d{6,10}$/.test(accountNumber)) {
        return json({ ok: false, error: 'Enter an account name, a six-digit sort code and a valid account number.' }, 400);
      }
      const formattedSortCode = `${sortCode.replace(/-/g, '').slice(0, 2)}-${sortCode.replace(/-/g, '').slice(2, 4)}-${sortCode.replace(/-/g, '').slice(4, 6)}`;
      await run(env.DB, `UPDATE bank_details SET is_active = 0 WHERE is_active = 1`);
      await run(env.DB, `INSERT INTO bank_details (label, account_name, sort_code, account_number, bank_name, is_active) VALUES (?, ?, ?, ?, ?, 1)`, [label, accountName, formattedSortCode, accountNumber, bankName || null]);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Unknown invoice action.' }, 400);
  } catch (error) {
    console.error(JSON.stringify({ event: 'admin_invoices_post_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to update this invoice.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
