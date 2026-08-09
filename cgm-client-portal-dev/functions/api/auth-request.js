/**
 * POST /api/auth-request
 * Body: { username: string }
 *
 * Looks up the client by username. If found, generates a one-time
 * magic-link token (15-min expiry) and emails it to the client.
 *
 * Response is ALWAYS 200 OK with a generic message to avoid leaking
 * which usernames exist. The actual email send is best-effort.
 */

import { json, handlePreflight, first, run } from '../_lib/db.js';
import { randomToken, sha256, MAGIC_LINK_TTL_MINUTES } from '../_lib/auth.js';
import { sendMagicLinkEmail } from '../_lib/email.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').toString().trim().toLowerCase();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    if (!username) {
      return json({ ok: false, error: 'Username is required.' }, 400);
    }

    const db = env.DB;
    if (!db) {
      return json({ ok: false, error: 'The portal is not configured yet. Please contact us.' }, 503);
    }
    const client = await first(
      db,
      `SELECT id, household_name, email, is_active
       FROM clients
       WHERE LOWER(username) = ?`,
      [username],
    );

    // Always return the same success-style message to avoid user enumeration.
    const genericPayload = {
      ok: true,
      message:
        "If this username exists in our system, we've just sent a secure login link to the email address we have on file. The link will expire in 15 minutes.",
    };

    // A small best-effort limit prevents a guessed username being used to
    // repeatedly email a household. The generic reply preserves privacy.
    const canRequest = await canSendMagicLink(env.PORTAL_KV, `portal-login-ip:${ip}`, 8, 15 * 60);
    const canSendToHousehold = !client || !client.is_active
      ? true
      : await canSendMagicLink(env.PORTAL_KV, `portal-login-client:${client.id}`, 3, 15 * 60);

    if (!client || !client.is_active || !canRequest || !canSendToHousehold) {
      return json(genericPayload);
    }

    // Only a digest is stored in D1. The raw 256-bit token exists only in the
    // email, so a database read alone cannot be used to sign in as a client.
    const token = randomToken(32);
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000).toISOString();
    await run(
      db,
      `INSERT INTO magic_tokens (token, client_id, expires_at) VALUES (?, ?, ?)`,
      [tokenHash, client.id, expiresAt],
    );

    // Send email (best-effort). In local mode this is deliberately captured
    // instead of delivered, so a test run cannot contact a real client.
    let developmentMagicLink = null;
    try {
      const delivery = await sendMagicLinkEmail(
        {
          to: client.email,
          householdName: client.household_name,
          token,
          verifyPath: '/portal/verify/',
        },
        env,
      );
      if (env.PORTAL_ENVIRONMENT === 'local' && delivery?.delivery === 'captured') {
        developmentMagicLink = delivery.magicLink;
      }
    } catch (e) {
      console.error('[auth-request] email send failed:', e);
    }

    return json({
      ...genericPayload,
      ...(developmentMagicLink ? { developmentMagicLink } : {}),
    });
  } catch (err) {
    console.error('[auth-request]', err);
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
  }
}

async function canSendMagicLink(kv, key, limit, windowSeconds) {
  // KV is an explicit Cloudflare binding in the activation instructions. If a
  // preview deployment does not have it yet, login remains functional but the
  // Cloudflare WAF should still be enabled before public launch.
  if (!kv) return true;
  const now = Math.floor(Date.now() / 1000);
  const raw = await kv.get(key);
  let state = raw ? JSON.parse(raw) : { count: 0, reset: now + windowSeconds };
  if (now >= state.reset) state = { count: 0, reset: now + windowSeconds };
  if (state.count >= limit) return false;
  state.count += 1;
  await kv.put(key, JSON.stringify(state), { expirationTtl: Math.max(60, state.reset - now + 30) });
  return true;
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
