/**
 * GET /api/admin-clients
 *
 * Returns a list of all clients (admin only). Includes counts of
 * notes and images per client so the dashboard can show summaries.
 *
 * Optional query params:
 *   - q: search term (matches username, household_name, email, address_line)
 *   - activeOnly: "1" to filter only active clients
 */

import { json, handlePreflight, all } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin !== 1) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toString().trim();
    const activeOnly = url.searchParams.get('activeOnly') === '1';

    let sql = `
      SELECT c.id, c.username, c.household_name, c.email, c.address_line,
             c.service_area, c.notes_internal, c.is_active, c.created_at,
             (SELECT COUNT(*) FROM notes  n WHERE n.client_id = c.id) AS note_count,
             (SELECT COUNT(*) FROM images i WHERE i.client_id = c.id) AS image_count,
             (SELECT MAX(n.created_at) FROM notes n WHERE n.client_id = c.id) AS last_note_at,
             (SELECT COUNT(*) FROM portal_messages m WHERE m.client_id = c.id AND m.sender_type = 'client' AND m.recipient_read_at IS NULL) AS unread_message_count,
             (SELECT COUNT(*) FROM visits v WHERE v.client_id = c.id AND v.status IN ('scheduled','confirmed','reschedule_requested')) AS upcoming_visit_count
      FROM clients c
      WHERE 1=1
    `;
    const params = [];
    if (q) {
      sql += ` AND (
        LOWER(c.username)       LIKE LOWER(?) OR
        LOWER(c.household_name) LIKE LOWER(?) OR
        LOWER(c.email)          LIKE LOWER(?) OR
        LOWER(c.address_line || ' ' || COALESCE(c.service_area,'')) LIKE LOWER(?)
      )`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (activeOnly) {
      sql += ` AND c.is_active = 1`;
    }
    sql += ` ORDER BY c.household_name ASC`;

    const rows = await all(env.DB, sql, params);

    return json({
      ok: true,
      clients: rows.map((r) => ({
        id: r.id,
        username: r.username,
        householdName: r.household_name,
        email: r.email,
        addressLine: r.address_line,
        serviceArea: r.service_area,
        notesInternal: r.notes_internal,
        isActive: r.is_active === 1,
        createdAt: r.created_at,
        noteCount: r.note_count,
        imageCount: r.image_count,
        lastNoteAt: r.last_note_at,
        unreadMessageCount: r.unread_message_count,
        upcomingVisitCount: r.upcoming_visit_count,
      })),
    });
  } catch (err) {
    console.error('[admin-clients]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
