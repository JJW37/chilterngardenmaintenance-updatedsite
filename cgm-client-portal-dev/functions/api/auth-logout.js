/**
 * POST /api/auth-logout
 *
 * Destroys the current session and clears the cookie.
 */

import { json, handlePreflight } from '../_lib/db.js';
import { getSessionFromRequest, destroySession, buildClearCookieHeader, COOKIE_NAME } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (session) {
      await destroySession(env.DB, session.session_id);
    }
    return json(
      { ok: true },
      200,
      {
        'Set-Cookie': buildClearCookieHeader({
          secure: new URL(request.url).protocol === 'https:',
        }),
      },
    );
  } catch (err) {
    console.error('[auth-logout]', err);
    return json({ ok: false, error: 'logout_failed' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
