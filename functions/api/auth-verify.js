/**
 * GET /api/auth-verify?token=...
 *
 * Verifies a magic-link token. If valid, creates a session, sets the
 * session cookie, and redirects the user to /portal/.
 *
 * If the token is invalid/expired/used, redirects to /login/?error=...
 */

import { first, run, handlePreflight } from '../_lib/db.js';
import { createSession, buildSetCookieHeader, sha256 } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return Response.redirect(new URL('/login/?error=invalid_token', request.url).toString(), 302);
  }

  const db = env.DB;
  if (!db || !env.SESSION_SECRET) {
    return Response.redirect(new URL('/login/?error=unavailable', request.url).toString(), 302);
  }
  const tokenHash = await sha256(token);

  const row = await first(
    db,
    `SELECT t.client_id, t.expires_at, t.used, c.is_active
     FROM magic_tokens t
     JOIN clients c ON c.id = t.client_id
     WHERE t.token = ?`,
    [tokenHash],
  );

  if (!row || row.used === 1 || new Date(row.expires_at) <= new Date()) {
    return Response.redirect(new URL('/login/?error=invalid_token', request.url).toString(), 302);
  }

  if (!row.is_active) {
    return Response.redirect(new URL('/login/?error=inactive', request.url).toString(), 302);
  }

  // Claim the token atomically. Two clicks on the same email cannot create
  // two sessions: only the request that changes `used` from 0 to 1 proceeds.
  const claim = await run(
    db,
    `UPDATE magic_tokens
     SET used = 1
     WHERE token = ? AND used = 0 AND expires_at > ?`,
    [tokenHash, new Date().toISOString()],
  );
  if (!claim.meta?.changes) {
    return Response.redirect(new URL('/login/?error=invalid_token', request.url).toString(), 302);
  }

  // Create session
  const { cookieValue, expiresAt } = await createSession(db, env, { clientId: row.client_id });

  const headers = new Headers();
  headers.set('Location', new URL('/portal/', request.url).toString());
  headers.set(
    'Set-Cookie',
    buildSetCookieHeader(cookieValue, expiresAt, {
      secure: new URL(request.url).protocol === 'https:',
    }),
  );
  return new Response(null, { status: 302, headers });
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
