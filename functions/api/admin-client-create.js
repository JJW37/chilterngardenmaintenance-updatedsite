/**
 * POST /api/admin-client-create
 * Body (JSON):
 *   {
 *     username:       string, required, lowercase, unique
 *     householdName:  string, required
 *     email:          string, required
 *     addressLine?:   string
 *     serviceArea?:   string
 *     notesInternal?: string  (admin-only notes, NOT visible to client)
 *   }
 *
 * Creates a new client row. Returns the new client's id.
 *
 * Auth: admin session required.
 */

import { json, handlePreflight, run, first } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin !== 1) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').toString().trim().toLowerCase();
    const householdName = (body.householdName || '').toString().trim();
    const email = (body.email || '').toString().trim().toLowerCase();
    const addressLine = (body.addressLine || '').toString().trim() || null;
    const serviceArea = (body.serviceArea || '').toString().trim() || null;
    const notesInternal = (body.notesInternal || '').toString().trim() || null;

    if (!username || !householdName || !email) {
      return json({ ok: false, error: 'Username, household name and email are required.' }, 400);
    }
    if (!/^[a-z0-9][a-z0-9-]{2,40}$/.test(username)) {
      return json({
        ok: false,
        error: 'Username must be 3-40 chars, lowercase letters, numbers and hyphens only.',
      }, 400);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'Email address is not valid.' }, 400);
    }

    // Uniqueness check
    const existing = await first(env.DB, `SELECT id FROM clients WHERE LOWER(username) = ? OR LOWER(email) = ?`, [
      username,
      email,
    ]);
    if (existing) {
      return json({ ok: false, error: 'A client with that username or email already exists.' }, 409);
    }

    const result = await run(
      env.DB,
      `INSERT INTO clients (username, household_name, email, address_line, service_area, notes_internal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, householdName, email, addressLine, serviceArea, notesInternal],
    );

    const newId = result.meta?.last_row_id;

    return json({
      ok: true,
      client: {
        id: newId,
        username,
        householdName,
        email,
        addressLine,
        serviceArea,
        notesInternal,
      },
    });
  } catch (err) {
    console.error('[admin-client-create]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
