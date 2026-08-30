/**
 * POST /api/auth-login
 * Body: { username, password }
 *
 * Password-based household login. A response never confirms whether a
 * username exists, whether the account is inactive, or whether it simply has
 * not been activated yet.
 */

import { first, json, handlePreflight } from '../_lib/db.js';
import { buildSetCookieHeader, createSession, verifyPassword } from '../_lib/auth.js';

const MAX_ATTEMPTS = 5;
const RATE_WINDOW_SECONDS = 5 * 60;

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateAllowed = await consumeAttempt(env.PORTAL_KV, `portal-client-password:${ip}`);
    if (!rateAllowed) {
      return json({ ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' }, 429);
    }

    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString();
    if (!username || !password) {
      return json({ ok: false, error: 'Enter your username and password.' }, 400);
    }
    if (!env.DB || !env.SESSION_SECRET) {
      return json({ ok: false, error: 'The private portal is not configured yet. Please contact CGM.' }, 503);
    }

    const client = await first(
      env.DB,
      `SELECT id, password_hash, is_active
       FROM clients
       WHERE LOWER(username) = ?`,
      [username],
    );
    const valid = Boolean(
      client
      && client.is_active === 1
      && client.password_hash
      && await verifyPassword(password, client.password_hash),
    );
    if (!valid) {
      return json({ ok: false, error: 'Invalid username or password.' }, 401);
    }

    const { cookieValue, expiresAt } = await createSession(env.DB, env, { clientId: client.id });
    return json({ ok: true, redirect: '/portal/' }, 200, {
      'Set-Cookie': buildSetCookieHeader(cookieValue, expiresAt, {
        secure: new URL(request.url).protocol === 'https:',
      }),
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'client_password_login_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to sign in. Please try again.' }, 500);
  }
}

async function consumeAttempt(kv, key) {
  if (!kv) return true;
  const now = Math.floor(Date.now() / 1000);
  const raw = await kv.get(key);
  let state = raw ? JSON.parse(raw) : { count: 0, reset: now + RATE_WINDOW_SECONDS };
  if (now >= state.reset) state = { count: 0, reset: now + RATE_WINDOW_SECONDS };
  if (state.count >= MAX_ATTEMPTS) return false;
  state.count += 1;
  await kv.put(key, JSON.stringify(state), {
    expirationTtl: Math.max(60, state.reset - now + 30),
  });
  return true;
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
