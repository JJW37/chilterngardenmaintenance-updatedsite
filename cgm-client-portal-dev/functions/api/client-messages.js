/**
 * Private, persistent two-way message thread.
 *
 * GET marks messages from the other party as read. POST adds a message scoped
 * to the selected household; staff must explicitly supply clientId and never
 * receive access through a client supplied id alone.
 */

import { all, first, handlePreflight, json, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { cleanText, positiveId } from '../_lib/portal-records.js';

const MAX_BODY = 8000;

async function resolveScope(request, env, requestedClientId) {
  const session = await getSessionFromRequest(env.DB, env, request);
  if (!session) return { error: json({ ok: false, error: 'not_authenticated' }, 401) };
  const clientId = session.is_admin === 1 ? positiveId(requestedClientId) : positiveId(session.client_id);
  if (!clientId) return { error: json({ ok: false, error: 'clientId is required.' }, 400) };
  const client = await first(env.DB, 'SELECT id, household_name, is_active FROM clients WHERE id = ?', [clientId]);
  if (!client || client.is_active !== 1) return { error: json({ ok: false, error: 'client_not_found' }, 404) };
  return { session, clientId, client };
}

function mapMessage(row) {
  return {
    id: row.id,
    senderType: row.sender_type,
    senderName: row.sender_name,
    body: row.body,
    visit: row.visit_id ? { id: row.visit_id, scheduledStart: row.visit_scheduled_start } : null,
    invoice: row.invoice_id ? { id: row.invoice_id, invoiceNumber: row.invoice_number } : null,
    attachment: row.attachment_image_id ? {
      id: row.attachment_image_id,
      filename: row.attachment_filename,
      caption: row.attachment_caption,
      url: `/api/client-image-get?id=${row.attachment_image_id}`,
    } : null,
    recipientReadAt: row.recipient_read_at,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const url = new URL(request.url);
    const resolved = await resolveScope(request, env, url.searchParams.get('clientId'));
    if (resolved.error) return resolved.error;
    const incomingSender = resolved.session.is_admin === 1 ? 'client' : 'admin';
    await run(
      env.DB,
      `UPDATE portal_messages SET recipient_read_at = datetime('now')
       WHERE client_id = ? AND sender_type = ? AND recipient_read_at IS NULL`,
      [resolved.clientId, incomingSender],
    );
    const rows = await all(
      env.DB,
      `SELECT m.id, m.sender_type, m.sender_name, m.body, m.visit_id, m.invoice_id,
              m.attachment_image_id, m.recipient_read_at, m.created_at,
              v.scheduled_start AS visit_scheduled_start,
              i.invoice_number,
              image.filename AS attachment_filename, image.caption AS attachment_caption
       FROM portal_messages m
       LEFT JOIN visits v ON v.id = m.visit_id AND v.client_id = m.client_id
       LEFT JOIN invoices i ON i.id = m.invoice_id AND i.client_id = m.client_id
       LEFT JOIN images image ON image.id = m.attachment_image_id AND image.client_id = m.client_id
       WHERE m.client_id = ?
       ORDER BY m.created_at ASC, m.id ASC`,
      [resolved.clientId],
    );
    return json({ ok: true, messages: rows.map(mapMessage) });
  } catch (error) {
    console.error('[client-messages:get]', error);
    return json({ ok: false, error: 'Unable to load messages.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const body = await request.json().catch(() => ({}));
    const resolved = await resolveScope(request, env, body.clientId);
    if (resolved.error) return resolved.error;
    const { session, clientId, client } = resolved;
    const attachmentImageId = positiveId(body.attachmentImageId);
    let message = cleanText(body.body, MAX_BODY);
    const visitId = positiveId(body.visitId);
    const invoiceId = positiveId(body.invoiceId);
    if (!message && !attachmentImageId) return json({ ok: false, error: 'Write a message or attach a photo.' }, 400);
    if (!message) message = 'Photo attached.';

    if (visitId) {
      const visit = await first(env.DB, 'SELECT id FROM visits WHERE id = ? AND client_id = ?', [visitId, clientId]);
      if (!visit) return json({ ok: false, error: 'The selected visit is not available.' }, 400);
    }
    if (invoiceId) {
      const invoice = await first(env.DB, `SELECT id FROM invoices WHERE id = ? AND client_id = ? AND status NOT IN ('draft', 'cancelled')`, [invoiceId, clientId]);
      if (!invoice) return json({ ok: false, error: 'The selected invoice is not available.' }, 400);
    }
    if (attachmentImageId) {
      const image = await first(env.DB, 'SELECT id FROM images WHERE id = ? AND client_id = ?', [attachmentImageId, clientId]);
      if (!image) return json({ ok: false, error: 'The attached photo is not available.' }, 400);
    }

    const senderType = session.is_admin === 1 ? 'admin' : 'client';
    const senderName = senderType === 'admin' ? 'Chiltern Garden Maintenance' : client.household_name;
    const created = await run(
      env.DB,
      `INSERT INTO portal_messages (client_id, sender_type, sender_name, body, visit_id, invoice_id, attachment_image_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, senderType, senderName, message, visitId, invoiceId, attachmentImageId],
    );
    const id = created.meta?.last_row_id;
    return json({
      ok: true,
      message: {
        id,
        senderType,
        senderName,
        body: message,
        visit: visitId ? { id: visitId } : null,
        invoice: invoiceId ? { id: invoiceId } : null,
        attachment: attachmentImageId ? { id: attachmentImageId, url: `/api/client-image-get?id=${attachmentImageId}` } : null,
        recipientReadAt: null,
        createdAt: new Date().toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error('[client-messages:post]', error);
    return json({ ok: false, error: 'Unable to send message.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
