/** GET /api/client-invoice-pdf?id=&clientId= — securely stream an invoice PDF. */

import { first, json, handlePreflight } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

function validId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function safeDownloadName(value) {
  return String(value || 'invoice').replace(/[^A-Za-z0-9_-]/g, '-');
}

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) return json({ ok: false, error: 'not_authenticated' }, 401);
    const url = new URL(request.url);
    const invoiceId = validId(url.searchParams.get('id'));
    const selectedClientId = validId(url.searchParams.get('clientId'));
    const clientId = session.is_admin === 1 ? selectedClientId : session.client_id;
    if (!invoiceId || !clientId) return json({ ok: false, error: 'Invoice is not available.' }, 400);
    const invoice = await first(env.DB, `SELECT invoice_number, r2_key FROM invoices WHERE id = ? AND client_id = ? AND status NOT IN ('draft', 'cancelled')`, [invoiceId, clientId]);
    if (!invoice?.r2_key) return json({ ok: false, error: 'No PDF has been attached to this invoice.' }, 404);
    const object = await env.PORTAL_BUCKET.get(invoice.r2_key);
    if (!object) return json({ ok: false, error: 'The invoice PDF could not be found.' }, 404);
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeDownloadName(invoice.invoice_number)}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'client_invoice_pdf_get_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to download this invoice PDF.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
