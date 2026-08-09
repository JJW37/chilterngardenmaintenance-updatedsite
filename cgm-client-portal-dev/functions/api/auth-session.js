/**
 * GET /api/auth-session
 *
 * Returns the current session info (or null if not logged in).
 * Used by the portal pages to decide whether to redirect to /login/.
 */

import { json, handlePreflight } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) {
      return json({ authenticated: false });
    }

    let client = null;
    if (session.client_id) {
      client = await env.DB
        .prepare(
          `SELECT id, username, household_name, email, address_line, service_area
           FROM clients WHERE id = ?`,
        )
        .bind(session.client_id)
        .first();
    }

    return json({
      authenticated: true,
      isAdmin: session.is_admin === 1,
      client: client
        ? {
            id: client.id,
            username: client.username,
            householdName: client.household_name,
            email: client.email,
            addressLine: client.address_line,
            serviceArea: client.service_area,
          }
        : null,
    });
  } catch (err) {
    console.error('[auth-session]', err);
    return json({ authenticated: false, error: 'session_check_failed' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
