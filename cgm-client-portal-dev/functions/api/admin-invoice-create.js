/** POST /api/admin-invoice-create — create and issue a client invoice. */

import { first, json, handlePreflight, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import {
  calculateInvoiceTotals,
  nextInvoiceNumber,
  normaliseLineItems,
  normaliseVatRate,
  validIsoDate,
} from '../_lib/invoices.js';

const MAX_NOTES_LENGTH = 8000;
const MAX_REFERENCE_LENGTH = 160;

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin !== 1) return json({ ok: false, error: 'forbidden' }, 403);

    const body = await request.json().catch(() => ({}));
    const clientId = Number.parseInt(body.clientId, 10);
    const dueDate = String(body.dueDate || '').trim();
    const reference = String(body.reference || '').trim();
    const notes = String(body.notes || '').trim();
    const paymentTerms = String(body.paymentTerms || 'On receipt').trim() || 'On receipt';
    const lineItems = normaliseLineItems(body.lineItems);
    const vatRate = normaliseVatRate(body.vatRate ?? 0);

    if (!Number.isSafeInteger(clientId) || clientId < 1) return json({ ok: false, error: 'Choose a client.' }, 400);
    if (!validIsoDate(dueDate)) return json({ ok: false, error: 'Choose a valid payment due date.' }, 400);
    if (!lineItems.ok) return json({ ok: false, error: lineItems.error }, 400);
    if (vatRate === null) return json({ ok: false, error: 'VAT rate must be between 0% and 100%.' }, 400);
    if (reference.length > MAX_REFERENCE_LENGTH || notes.length > MAX_NOTES_LENGTH || paymentTerms.length > 120) {
      return json({ ok: false, error: 'One or more invoice fields are too long.' }, 400);
    }

    const client = await first(env.DB, `SELECT id, household_name FROM clients WHERE id = ? AND is_active = 1`, [clientId]);
    if (!client) return json({ ok: false, error: 'This client cannot receive a new invoice.' }, 404);

    const year = new Date().getUTCFullYear();
    const lastInvoice = await first(
      env.DB,
      `SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
      [`CGM-${year}-%`],
    );
    const invoiceNumber = nextInvoiceNumber(lastInvoice?.invoice_number, year);
    const totals = calculateInvoiceTotals(lineItems.items, vatRate);
    if (totals.total <= 0) return json({ ok: false, error: 'The invoice total must be greater than £0.00.' }, 400);

    const created = await run(
      env.DB,
      `INSERT INTO invoices (
        client_id, invoice_number, status, due_date, payment_terms, reference,
        subtotal, vat_rate, vat_amount, total, notes
      ) VALUES (?, ?, 'sent', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId, invoiceNumber, dueDate, paymentTerms, reference || null,
        totals.subtotal, vatRate, totals.vatAmount, totals.total, notes || null,
      ],
    );
    const invoiceId = created.meta?.last_row_id;
    if (!invoiceId) throw new Error('Invoice identifier was not returned by D1.');

    for (let index = 0; index < lineItems.items.length; index += 1) {
      const item = lineItems.items[index];
      await run(
        env.DB,
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, line_total, sort_order, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity, item.unitPrice, item.lineTotal, index, item.category],
      );
    }

    return json({
      ok: true,
      invoice: { id: invoiceId, number: invoiceNumber, total: totals.total, clientName: client.household_name },
    }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: 'admin_invoice_create_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to create this invoice.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
