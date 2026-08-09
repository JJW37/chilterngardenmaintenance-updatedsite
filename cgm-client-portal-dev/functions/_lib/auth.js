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

import { first } from './db.js';

export const COOKIE_NAME = 'cgm_portal_session';
export const SESSION_TTL_HOURS = 24 * 7; // 7 days
export const MAGIC_LINK_TTL_MINUTES = 15;
export const PASSWORD_MIN_LENGTH = 12;
export const PBKDF2_ITERATIONS = 600000;
const PASSWORD_PREFIX = 'pbkdf2_sha256';

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

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value) {
  if (!/^[a-f0-9]+$/i.test(value) || value.length % 2 !== 0) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Password policy deliberately favours a memorable passphrase over obscure
 * complexity rules. It is enforced on the server for both initial activation
 * and later password changes.
 */
export function passwordError(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > 256) return 'Password is too long.';
  return null;
}

async function derivePasswordHash(password, salt, iterations) {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    256,
  );
  return new Uint8Array(derived);
}

/**
 * Produce a portable D1-safe password hash. The value is deliberately
 * self-describing so iteration upgrades can be made without guessing how an
 * existing profile was created: pbkdf2_sha256$iterations$hexSalt$hexHash.
 */
export async function hashPassword(password, salt = null) {
  const error = passwordError(password);
  if (error) throw new Error(error);
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, saltBytes, PBKDF2_ITERATIONS);
  return `${PASSWORD_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToHex(saltBytes)}$${bytesToHex(hash)}`;
}

/** Verify a PBKDF2 password hash without ever returning a password. */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== PASSWORD_PREFIX) return false;
  const iterations = Number.parseInt(parts[1], 10);
  const salt = hexToBytes(parts[2]);
  const expected = hexToBytes(parts[3]);
  if (!salt || !expected || expected.length !== 32 || !Number.isInteger(iterations)) return false;
  // Reject malformed database values rather than allowing a poisoned value to
  // force unexpectedly expensive work during a login request.
  if (iterations < 210000 || iterations > 1000000) return false;
  const actual = await derivePasswordHash(password, salt, iterations);
  return safeEqual(bytesToHex(actual), bytesToHex(expected));
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

/** Compare strings without early exit. Keeps cookie-signature checks uniform. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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
  if (!db || !env.SESSION_SECRET || !cookieValue || typeof cookieValue !== 'string') return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot < 1) return null;
  const sessionId = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);

  const expectedSig = await hmac(env.SESSION_SECRET, sessionId);
  if (!safeEqual(sig, expectedSig)) return null;

  const row = await first(
    db,
    `SELECT session_id, client_id, is_admin, expires_at
     FROM sessions
     WHERE session_id = ? AND expires_at > ?`,
    [sessionId, new Date().toISOString()],
  );
  if (!row) return null;

  // A deactivated household must lose access immediately, even if an older
  // browser still has a valid seven-day session cookie.
  if (row.client_id) {
    const client = await first(db, `SELECT is_active FROM clients WHERE id = ?`, [row.client_id]);
    if (!client || client.is_active !== 1) {
      await destroySession(db, sessionId);
      return null;
    }
  }
  return row;
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
export function buildSetCookieHeader(cookieValue, expiresAt, { secure = true } = {}) {
  const expires = new Date(expiresAt).toUTCString();
  return [
    `${COOKIE_NAME}=${cookieValue}`,
    `Path=/`,
    `Expires=${expires}`,
    `Max-Age=${SESSION_TTL_HOURS * 3600}`,
    `HttpOnly`,
    ...(secure ? [`Secure`] : []),
    `SameSite=Strict`,
  ].join('; ');
}

/** Build a Set-Cookie header that clears the session cookie. */
export function buildClearCookieHeader({ secure = true } = {}) {
  return [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `Max-Age=0`,
    `HttpOnly`,
    ...(secure ? [`Secure`] : []),
    `SameSite=Strict`,
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
  if (stored.startsWith(`${PASSWORD_PREFIX}$`)) {
    return verifyPassword(password, stored);
  }
  // Legacy support is kept only so an existing local development admin can
  // still sign in once and replace the secret. New credentials must use PBKDF2.
  if (stored.startsWith('sha256:')) {
    const hash = await sha256(password);
    return safeEqual(hash, stored.slice(7));
  }
  return safeEqual(password, stored);
}
