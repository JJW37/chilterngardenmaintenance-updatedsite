/** POST /api/admin-invoice-pdf — attach a PDF invoice to a record in R2. */

import { first, json, handlePreflight, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function pdfSafeName(invoiceNumber) {
  return String(invoiceNumber).replace(/[^A-Za-z0-9_-]/g, '-');
}

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin !== 1) return json({ ok: false, error: 'forbidden' }, 403);
    const form = await request.formData();
    const invoiceId = Number.parseInt(form.get('invoiceId'), 10);
    const file = form.get('file');
    if (!Number.isSafeInteger(invoiceId) || invoiceId < 1 || !file || typeof file.arrayBuffer !== 'function') {
      return json({ ok: false, error: 'Choose an invoice and a PDF file.' }, 400);
    }
    if (file.size <= 0 || file.size > MAX_PDF_BYTES || file.type !== 'application/pdf') {
      return json({ ok: false, error: 'The invoice PDF must be a valid file no larger than 10MB.' }, 400);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') return json({ ok: false, error: 'The uploaded file is not a PDF.' }, 400);
    const invoice = await first(env.DB, `SELECT id, invoice_number FROM invoices WHERE id = ?`, [invoiceId]);
    if (!invoice) return json({ ok: false, error: 'Invoice not found.' }, 404);
    const key = `invoices/${invoice.id}/${pdfSafeName(invoice.invoice_number)}.pdf`;
    await env.PORTAL_BUCKET.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
    await run(env.DB, `UPDATE invoices SET r2_key = ?, updated_at = datetime('now') WHERE id = ?`, [key, invoiceId]);
    return json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({ event: 'admin_invoice_pdf_upload_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to upload this invoice PDF.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
