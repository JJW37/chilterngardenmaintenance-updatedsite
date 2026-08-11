/**
 * GET /api/client-data
 *
 * Returns the logged-in client's full portal data:
 *   - household info
 *   - all notes (most recent first), grouped by type
 *   - latest visit summary (most recent note with note_type='visit')
 *   - full history timeline
 *   - all portfolio images (with proxy URLs)
 *
 * Auth: requires a valid client session OR an admin session (admin can
 * view any client by passing ?clientId=...).
 */

import { json, handlePreflight, all, first } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) {
      return json({ ok: false, error: 'not_authenticated' }, 401);
    }

    const url = new URL(request.url);
    let clientId = session.client_id;

    // Admin can view any client
    if (session.is_admin === 1) {
      const q = url.searchParams.get('clientId');
      if (q) clientId = parseInt(q, 10);
    }

    if (!clientId) {
      return json({ ok: false, error: 'no_client' }, 400);
    }

    const db = env.DB;

    // Client info
    const client = await first(
      db,
      `SELECT id, username, household_name, email, address_line, service_area, created_at
       FROM clients WHERE id = ? AND is_active = 1`,
      [clientId],
    );

    if (!client) {
      return json({ ok: false, error: 'client_not_found' }, 404);
    }

    // All notes (newest first)
    const notes = await all(
      db,
      `SELECT id, author_type, author_name, note_type, visit_date, title, body, pinned, created_at
       FROM notes
       WHERE client_id = ?
       ORDER BY pinned DESC, created_at DESC`,
      [clientId],
    );

    // Latest visit note (for "progress based on most recent visit")
    const latestVisit = await first(
      db,
      `SELECT id, author_name, visit_date, title, body, created_at
       FROM notes
       WHERE client_id = ? AND note_type = 'visit'
       ORDER BY visit_date DESC, created_at DESC
       LIMIT 1`,
      [clientId],
    );

    const planItems = await all(
      db,
      `SELECT id, season, title, detail, status, priority, target_date, created_at, updated_at
       FROM garden_plan_items
       WHERE client_id = ?
       ORDER BY
         CASE status WHEN 'in_progress' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
         COALESCE(target_date, '9999-12-31') ASC,
         id DESC`,
      [clientId],
    );

    // Images (newest first)
    const images = await all(
      db,
      `SELECT id, uploader_type, uploader_name, filename, mime_type, size_bytes,
              caption, category, visit_date, created_at, r2_key
       FROM images
       WHERE client_id = ?
       ORDER BY created_at DESC`,
      [clientId],
    );

    // Map r2_key -> proxied URL (so client never gets the raw R2 key)
    const imagesWithUrls = images.map((img) => ({
      id: img.id,
      uploaderType: img.uploader_type,
      uploaderName: img.uploader_name,
      filename: img.filename,
      mimeType: img.mime_type,
      sizeBytes: img.size_bytes,
      caption: img.caption,
      category: img.category,
      visitDate: img.visit_date,
      createdAt: img.created_at,
      url: `/api/client-image-get?id=${img.id}`,
    }));

    return json({
      ok: true,
      viewer: {
        isAdmin: session.is_admin === 1,
        clientId: session.client_id,
      },
      client: {
        id: client.id,
        username: client.username,
        householdName: client.household_name,
        email: client.email,
        addressLine: client.address_line,
        serviceArea: client.service_area,
        relationshipStarted: client.created_at,
      },
      latestVisit: latestVisit
        ? {
            id: latestVisit.id,
            authorName: latestVisit.author_name,
            visitDate: latestVisit.visit_date,
            title: latestVisit.title,
            body: latestVisit.body,
            createdAt: latestVisit.created_at,
        }
        : null,
      planItems: planItems.map((item) => ({
        id: item.id,
        season: item.season,
        title: item.title,
        detail: item.detail,
        status: item.status,
        priority: item.priority,
        targetDate: item.target_date,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        authorType: n.author_type,
        authorName: n.author_name,
        noteType: n.note_type,
        visitDate: n.visit_date,
        title: n.title,
        body: n.body,
        pinned: n.pinned === 1,
        createdAt: n.created_at,
      })),
      images: imagesWithUrls,
    });
  } catch (err) {
    console.error('[client-data]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
