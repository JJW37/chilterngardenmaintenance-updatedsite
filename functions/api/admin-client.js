/**
 * PATCH /api/admin-client
 * Body (JSON):
 *   {
 *     id:            number, required
 *     householdName?: string
 *     email?:        string
 *     addressLine?:  string
 *     serviceArea?:  string
 *     notesInternal?: string
 *     isActive?:     boolean
 *   }
 *
 * Updates an existing client. Cannot change username (it's used as the
 * login identifier).
 *
 * Auth: admin session required.
 */

import { json, handlePreflight, run, first } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

export async function onRequestPatch({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin !== 1) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const id = parseInt(body.id, 10);
    if (!id) {
      return json({ ok: false, error: 'id is required.' }, 400);
    }

    const client = await first(env.DB, `SELECT id FROM clients WHERE id = ?`, [id]);
    if (!client) {
      return json({ ok: false, error: 'client_not_found' }, 404);
    }

    const fields = [];
    const params = [];

    if (body.householdName !== undefined) {
      const v = body.householdName.toString().trim();
      if (!v) return json({ ok: false, error: 'householdName cannot be empty.' }, 400);
      fields.push('household_name = ?');
      params.push(v);
    }
    if (body.email !== undefined) {
      const v = body.email.toString().trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        return json({ ok: false, error: 'Email address is not valid.' }, 400);
      }
      fields.push('email = ?');
      params.push(v);
    }
    if (body.addressLine !== undefined) {
      fields.push('address_line = ?');
      params.push(body.addressLine.toString().trim() || null);
    }
    if (body.serviceArea !== undefined) {
      fields.push('service_area = ?');
      params.push(body.serviceArea.toString().trim() || null);
    }
    if (body.notesInternal !== undefined) {
      fields.push('notes_internal = ?');
      params.push(body.notesInternal.toString().trim() || null);
    }
    if (body.isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(body.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return json({ ok: false, error: 'No fields to update.' }, 400);
    }

    fields.push(`updated_at = datetime('now')`);
    params.push(id);

    await run(env.DB, `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, params);

    return json({ ok: true });
  } catch (err) {
    console.error('[admin-client]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
