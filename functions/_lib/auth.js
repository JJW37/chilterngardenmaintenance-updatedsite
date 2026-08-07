/**
 * CGM Client Portal - Auth helpers
 *
 * Two session types:
 *   1. Client session  - logged-in household (client_id set, is_admin=0)
 *   2. Admin session   - master login       (client_id NULL, is_admin=1)
 *
 * Session ID is a 256-bit random hex string stored in an HttpOnly cookie
 * named "cgm_portal_session". The session row in D1 is the source of truth.
 *
 * Required env:
 *   - SESSION_SECRET     : 32+ char secret used for HMAC of cookie value
 *   - MASTER_ADMIN_USER  : admin username (set in Cloudflare dashboard)
 *   - MASTER_ADMIN_PASS  : admin password (set in Cloudflare dashboard)
 *                          Store as a SHA-256 hash for safety - see README.
 */

import { all, first } from './db.js';

export const COOKIE_NAME = 'cgm_portal_session';
export const SESSION_TTL_HOURS = 24 * 7; // 7 days
export const MAGIC_LINK_TTL_MINUTES = 15;

/** Generate a cryptographically strong hex token. */
export function randomToken(byteLength = 32) {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hex digest of a string. */
export async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** HMAC-SHA-256 hex digest. */
export async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a session in D1 and return the signed cookie value to set.
 * Cookie format: <sessionId>.<hmac>
 */
export async function createSession(db, env, { clientId = null, isAdmin = false }) {
  const sessionId = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO sessions (session_id, client_id, is_admin, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(sessionId, clientId, isAdmin ? 1 : 0, expiresAt)
    .run();

  const sig = await hmac(env.SESSION_SECRET, sessionId);
  const cookieValue = `${sessionId}.${sig}`;
  return { sessionId, cookieValue, expiresAt };
}

/** Parse and verify a cookie value, returning the session row if valid. */
export async function verifySession(db, env, cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot < 1) return null;
  const sessionId = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);

  const expectedSig = await hmac(env.SESSION_SECRET, sessionId);
  if (sig !== expectedSig) return null;

  const row = await first(
    db,
    `SELECT session_id, client_id, is_admin, expires_at
     FROM sessions
     WHERE session_id = ? AND expires_at > datetime('now')`,
    [sessionId],
  );
  return row || null;
}

/** Delete a session from D1 (logout). */
export async function destroySession(db, sessionId) {
  if (!sessionId) return;
  await db.prepare(`DELETE FROM sessions WHERE session_id = ?`).bind(sessionId).run();
}

/**
 * Read & verify the session from the request's Cookie header.
 * Returns the session row or null.
 */
export async function getSessionFromRequest(db, env, request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifySession(db, env, match[1]);
}

/** Build a Set-Cookie header value for the session cookie. */
export function buildSetCookieHeader(cookieValue, expiresAt) {
  const expires = new Date(expiresAt).toUTCString();
  return [
    `${COOKIE_NAME}=${cookieValue}`,
    `Path=/`,
    `Expires=${expires}`,
    `Max-Age=${SESSION_TTL_HOURS * 3600}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
  ].join('; ');
}

/** Build a Set-Cookie header that clears the session cookie. */
export function buildClearCookieHeader() {
  return [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `Max-Age=0`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
  ].join('; ');
}

/**
 * Verify admin username/password against env vars.
 * Password may be stored as plain text OR as a sha256 hash (recommended).
 * If MASTER_ADMIN_PASS starts with "sha256:" we compare hashes.
 */
export async function verifyAdminCredentials(env, username, password) {
  if (!username || !password) return false;
  if (username !== env.MASTER_ADMIN_USER) return false;
  const stored = env.MASTER_ADMIN_PASS;
  if (!stored) return false;
  if (stored.startsWith('sha256:')) {
    const hash = await sha256(password);
    return hash === stored.slice(7);
  }
  return password === stored;
}
