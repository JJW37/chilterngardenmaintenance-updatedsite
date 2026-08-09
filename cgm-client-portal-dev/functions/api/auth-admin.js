/**
 * POST /api/auth-admin
 * Body: { username, password }
 *
 * Master admin login. On success, creates an admin session (is_admin=1,
 * client_id=NULL) and sets the cookie. The cookie is the SAME name as
 * the client session cookie - the portal reads is_admin to gate UI.
 */

import { json, handlePreflight } from '../_lib/db.js';
import { verifyAdminCredentials, createSession, buildSetCookieHeader } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    // Rate-limit by IP (best-effort, in-memory on each edge worker).
    // For real brute-force protection, also add Cloudflare Turnstile or WAF rules.
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateKey = `admin_login_${ip}`;
    try {
      env.PORTAL_KV && (await bumpRate(env.PORTAL_KV, rateKey, 5, 60 * 5)); // 5 attempts / 5 min
    } catch (e) {
      if (e.message === 'rate_limited') {
        return json({ ok: false, error: 'Too many login attempts. Please try again in a few minutes.' }, 429);
      }
      throw e;
    }

    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').toString().trim();
    const password = (body.password || '').toString();

    if (!username || !password) {
      return json({ ok: false, error: 'Username and password are required.' }, 400);
    }

    const ok = await verifyAdminCredentials(env, username, password);
    if (!ok) {
      return json({ ok: false, error: 'Invalid credentials.' }, 401);
    }

    if (!env.DB) {
      return json({ ok: false, error: 'Server is not configured (D1 binding missing).' }, 500);
    }

    const { cookieValue, expiresAt } = await createSession(env.DB, env, { isAdmin: true });

    return json({ ok: true, redirect: '/portal/admin/dashboard/' }, 200, {
      'Set-Cookie': buildSetCookieHeader(cookieValue, expiresAt, {
        secure: new URL(request.url).protocol === 'https:',
      }),
    });
  } catch (err) {
    console.error('[auth-admin]', err);
    return json({ ok: false, error: 'Login failed. Please try again.' }, 500);
  }
}

async function bumpRate(kv, key, limit, windowSec) {
  if (!kv) return;
  const now = Math.floor(Date.now() / 1000);
  const raw = await kv.get(key);
  let entry = raw ? JSON.parse(raw) : { count: 0, reset: now + windowSec };
  if (now > entry.reset) {
    entry = { count: 0, reset: now + windowSec };
  }
  entry.count += 1;
  await kv.put(key, JSON.stringify(entry), { expirationTtl: windowSec + 10 });
  if (entry.count > limit) {
    throw new Error('rate_limited');
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
