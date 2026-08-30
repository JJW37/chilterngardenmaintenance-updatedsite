/**
 * POST /api/client-invoice-action
 *
 * Records a client's payment signal without attempting to move money. Staff
 * still verify a bank transfer and use the admin payment ledger to record it.
 */

import { first, handlePreflight, json, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { roundMoney, validIsoDate } from '../_lib/invoices.js';
import { cleanText, normaliseMoney, positiveId } from '../_lib/portal-records.js';

const TYPES = new Set(['bank_transfer_notified', 'payment_plan_request']);

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) return json({ ok: false, error: 'not_authenticated' }, 401);
    if (session.is_admin === 1) return json({ ok: false, error: 'Use the staff invoice register to manage payment requests.' }, 403);

    const body = await request.json().catch(() => ({}));
    const invoiceId = positiveId(body.invoiceId);
    const intentType = cleanText(body.intentType, 50);
    if (!invoiceId || !TYPES.has(intentType)) return json({ ok: false, error: 'Choose a valid invoice action.' }, 400);
    const invoice = await first(
      env.DB,
      `SELECT id, client_id, invoice_number, status, total, amount_paid
       FROM invoices WHERE id = ? AND client_id = ?`,
      [invoiceId, session.client_id],
    );
    if (!invoice || ['draft', 'paid', 'cancelled'].includes(invoice.status)) {
      return json({ ok: false, error: 'This invoice no longer needs a payment action.' }, 404);
    }
    const balance = roundMoney(Number(invoice.total) - Number(invoice.amount_paid));
    if (balance <= 0) return json({ ok: false, error: 'This invoice has no balance due.' }, 409);

    let amount = normaliseMoney(body.amount);
    let proposedDate = cleanText(body.proposedDate, 10) || null;
    let note = cleanText(body.note, 2000) || null;
    if (intentType === 'bank_transfer_notified') {
      amount = amount || balance;
      if (amount > balance) return json({ ok: false, error: 'The transfer amount cannot exceed the balance due.' }, 400);
      proposedDate = null;
      note = note || 'Client says a bank transfer has been made.';
    } else {
      if (!amount || amount > balance || !proposedDate || !validIsoDate(proposedDate) || !note) {
        return json({ ok: false, error: 'Enter a proposed amount, a valid date and a short payment-plan message.' }, 400);
      }
    }

    // One open signal of each type per invoice is enough. Updating it lets a
    // household correct a proposed date without building a noisy history.
    const existing = await first(
      env.DB,
      `SELECT id FROM invoice_payment_intents
       WHERE invoice_id = ? AND client_id = ? AND intent_type = ? AND status = 'requested'
       ORDER BY id DESC LIMIT 1`,
      [invoiceId, session.client_id, intentType],
    );
    let intentId;
    if (existing) {
      intentId = existing.id;
      await run(
        env.DB,
        `UPDATE invoice_payment_intents
         SET amount = ?, proposed_date = ?, note = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [amount, proposedDate, note, intentId],
      );
    } else {
      const created = await run(
        env.DB,
        `INSERT INTO invoice_payment_intents (invoice_id, client_id, intent_type, amount, proposed_date, note, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'client')`,
        [invoiceId, session.client_id, intentType, amount, proposedDate, note],
      );
      intentId = created.meta?.last_row_id;
    }
    return json({
      ok: true,
      intent: { id: intentId, invoiceId, intentType, amount, proposedDate, note, status: 'requested' },
      message: intentType === 'bank_transfer_notified'
        ? 'CGM has been told that you have made a transfer. Your invoice remains outstanding until the payment is received and recorded.'
        : 'Your payment-plan request has been sent to CGM. Your invoice remains outstanding until a plan is agreed.',
    });
  } catch (error) {
    console.error('[client-invoice-action]', error);
    return json({ ok: false, error: 'Unable to save the invoice action.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
