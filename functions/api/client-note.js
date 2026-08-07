/**
 * POST /api/client-note
 * Body (JSON):
 *   { body: string, title?: string, noteType?: 'client_note'|'update'|'visit',
 *     visitDate?: string, clientId?: number (admin only) }
 *
 * - Client session  -> always creates a 'client_note' authored by client
 * - Admin session    -> can create any note type, can pass clientId to
 *                       target a specific client; also sends email notification
 *
 * Validates input length and trims.
 */

import { json, handlePreflight, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { sendNewNoteEmail } from '../_lib/email.js';
import { first } from '../_lib/db.js';

const MAX_BODY = 8000;
const MAX_TITLE = 200;

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) {
      return json({ ok: false, error: 'not_authenticated' }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const text = (body.body || '').toString().trim();
    const title = (body.title || '').toString().trim().slice(0, MAX_TITLE);
    let noteType = (body.noteType || 'client_note').toString();
    const visitDate = (body.visitDate || '').toString().trim() || null;

    if (!text) {
      return json({ ok: false, error: 'Note body cannot be empty.' }, 400);
    }
    if (text.length > MAX_BODY) {
      return json({ ok: false, error: `Note is too long (max ${MAX_BODY} characters).` }, 400);
    }

    let clientId;
    let authorType;
    let authorName;

    if (session.is_admin === 1) {
      authorType = 'admin';
      authorName = 'Chiltern Garden Maintenance';
      clientId = body.clientId ? parseInt(body.clientId, 10) : null;
      if (!clientId) {
        return json({ ok: false, error: 'clientId is required for admin notes.' }, 400);
      }
      // admin can choose note type, but validate
      if (!['client_note', 'update', 'visit'].includes(noteType)) {
        noteType = 'update';
      }
    } else {
      authorType = 'client';
      clientId = session.client_id;
      // Clients can only post client_note type
      noteType = 'client_note';
      // Try to grab a friendly author name from the client's household
      const client = await first(env.DB, `SELECT household_name FROM clients WHERE id = ?`, [clientId]);
      authorName = client?.household_name || 'Client';
    }

    const result = await run(
      env.DB,
      `INSERT INTO notes (client_id, author_type, author_name, note_type, visit_date, title, body)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, authorType, authorName, noteType, visitDate, title || null, text],
    );

    const noteId = result.meta?.last_row_id;

    // If admin posts an update/visit, notify the client by email
    if (session.is_admin === 1 && (noteType === 'update' || noteType === 'visit')) {
      const client = await first(env.DB, `SELECT household_name, email FROM clients WHERE id = ?`, [clientId]);
      if (client?.email) {
        const preview = text.length > 200 ? text.slice(0, 200) + '…' : text;
        try {
          await sendNewNoteEmail(
            {
              to: client.email,
              householdName: client.household_name,
              authorName: authorName,
              notePreview: preview,
            },
            env,
          );
        } catch (e) {
          console.error('[client-note] email notification failed:', e);
        }
      }
    }

    return json({
      ok: true,
      note: {
        id: noteId,
        authorType,
        authorName,
        noteType,
        visitDate,
        title: title || null,
        body: text,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[client-note]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
