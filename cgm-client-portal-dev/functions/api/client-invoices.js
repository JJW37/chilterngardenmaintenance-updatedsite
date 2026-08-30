/**
 * GET /api/client-invoices[?id=&clientId=]
 *
 * A household can only read its own invoices. A signed-in administrator may
 * inspect the selected household by passing clientId, matching the rest of the
 * Garden Passport admin-view behaviour.
 */

import { all, first, json, handlePreflight, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { roundMoney } from '../_lib/invoices.js';

function validId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function mapIntent(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
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

function mapInvoice(row, paymentIntent = null) {
  return {
    id: row.id,
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
    paymentIntent,
  };
}

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) return json({ ok: false, error: 'not_authenticated' }, 401);
    const url = new URL(request.url);
    const requestedClientId = validId(url.searchParams.get('clientId'));
    const clientId = session.is_admin === 1 ? requestedClientId : session.client_id;
    if (!clientId) return json({ ok: false, error: 'no_client' }, 400);

    await run(env.DB, `UPDATE invoices SET status = 'overdue', updated_at = datetime('now') WHERE client_id = ? AND status IN ('sent', 'partial') AND due_date < date('now')`, [clientId]);

    const client = await first(env.DB, `SELECT id, household_name FROM clients WHERE id = ? AND is_active = 1`, [clientId]);
    if (!client) return json({ ok: false, error: 'client_not_found' }, 404);
    const invoiceId = validId(url.searchParams.get('id'));

    if (invoiceId) {
      const invoice = await first(env.DB, `SELECT * FROM invoices WHERE id = ? AND client_id = ? AND status NOT IN ('draft', 'cancelled')`, [invoiceId, clientId]);
      if (!invoice) return json({ ok: false, error: 'Invoice not found.' }, 404);
      const [items, payments, bank, intents] = await Promise.all([
        all(env.DB, `SELECT description, quantity, unit_price, line_total, sort_order, category FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, id`, [invoiceId]),
        all(env.DB, `SELECT amount, payment_method, paid_date FROM payments WHERE invoice_id = ? ORDER BY paid_date DESC, id DESC`, [invoiceId]),
        first(env.DB, `SELECT label, account_name, sort_code, account_number, bank_name FROM bank_details WHERE is_active = 1 ORDER BY id DESC LIMIT 1`),
        all(env.DB, `SELECT id, invoice_id, intent_type, amount, proposed_date, note, status, created_by, resolved_at, created_at FROM invoice_payment_intents WHERE invoice_id = ? ORDER BY created_at DESC, id DESC`, [invoiceId]),
      ]);
      return json({ ok: true, client: { id: client.id, householdName: client.household_name }, invoice: mapInvoice(invoice, intents[0] ? mapIntent(intents[0]) : null), items, payments, paymentIntents: intents.map(mapIntent), bankDetails: bank });
    }

    const [invoices, intentRows, spendRows] = await Promise.all([
      all(env.DB, `SELECT * FROM invoices WHERE client_id = ? AND status NOT IN ('draft', 'cancelled') ORDER BY issue_date DESC, id DESC`, [clientId]),
      all(env.DB, `SELECT id, invoice_id, intent_type, amount, proposed_date, note, status, created_by, resolved_at, created_at FROM invoice_payment_intents WHERE client_id = ? ORDER BY created_at DESC, id DESC`, [clientId]),
      all(env.DB, `SELECT ii.category, ROUND(SUM(ii.line_total), 2) AS total FROM invoice_items ii JOIN invoices i ON i.id = ii.invoice_id WHERE i.client_id = ? AND i.status NOT IN ('draft', 'cancelled') GROUP BY ii.category ORDER BY total DESC`, [clientId]),
    ]);
    const latestIntentByInvoice = new Map();
    for (const intent of intentRows) {
      if (!latestIntentByInvoice.has(intent.invoice_id)) latestIntentByInvoice.set(intent.invoice_id, mapIntent(intent));
    }
    return json({
      ok: true,
      client: { id: client.id, householdName: client.household_name },
      invoices: invoices.map((invoice) => mapInvoice(invoice, latestIntentByInvoice.get(invoice.id) || null)),
      spendByCategory: spendRows.map((row) => ({ category: row.category || 'maintenance', total: roundMoney(row.total) })),
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'client_invoices_get_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to load invoices.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
