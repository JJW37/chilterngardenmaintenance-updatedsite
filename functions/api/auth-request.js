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
import { randomToken, MAGIC_LINK_TTL_MINUTES } from '../_lib/auth.js';
import { sendMagicLinkEmail } from '../_lib/email.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').toString().trim().toLowerCase();

    if (!username) {
      return json({ ok: false, error: 'Username is required.' }, 400);
    }

    const db = env.DB;
    const client = await first(
      db,
      `SELECT id, household_name, email, is_active
       FROM clients
       WHERE LOWER(username) = ?`,
      [username],
    );

    // Always return the same success-style message to avoid user enumeration.
    const genericOk = json({
      ok: true,
      message:
        "If this username exists in our system, we've just sent a secure login link to the email address we have on file. The link will expire in 15 minutes.",
    });

    if (!client || !client.is_active) {
      return genericOk;
    }

    // Generate token & store
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000).toISOString();
    await run(
      db,
      `INSERT INTO magic_tokens (token, client_id, expires_at) VALUES (?, ?, ?)`,
      [token, client.id, expiresAt],
    );

    // Send email (best-effort)
    try {
      await sendMagicLinkEmail(
        {
          to: client.email,
          householdName: client.household_name,
          token,
<<<<<<< Updated upstream
          verifyPath: '/portal/verify/',
=======
          verifyPath: '/chilterngardenmaintenance-updatedsite/portal/verify/',
>>>>>>> Stashed changes
        },
        env,
      );
    } catch (e) {
      console.error('[auth-request] email send failed:', e);
    }

    return genericOk;
  } catch (err) {
    console.error('[auth-request]', err);
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
