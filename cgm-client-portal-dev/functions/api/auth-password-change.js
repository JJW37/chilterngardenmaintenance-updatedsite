/**
 * POST /api/auth-password-change
 * Body: { currentPassword, newPassword }
 *
 * A signed-in household can replace its own password. We require the current
 * password, reject cross-origin form posts, and revoke all other sessions for
 * that household after a change.
 */

import { first, json, handlePreflight, run } from '../_lib/db.js';
import { getSessionFromRequest, hashPassword, passwordError, verifyPassword } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  if (!isSameOrigin(request)) return json({ ok: false, error: 'Invalid request origin.' }, 403);

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin === 1 || !session.client_id) {
      return json({ ok: false, error: 'not_authenticated' }, 401);
    }
    const body = await request.json().catch(() => ({}));
    const currentPassword = (body.currentPassword || '').toString();
    const newPassword = (body.newPassword || '').toString();
    const policyError = passwordError(newPassword);
    if (policyError) return json({ ok: false, error: policyError }, 400);

    const client = await first(env.DB, 'SELECT password_hash FROM clients WHERE id = ? AND is_active = 1', [session.client_id]);
    if (!client?.password_hash || !await verifyPassword(currentPassword, client.password_hash)) {
      return json({ ok: false, error: 'Your current password is not correct.' }, 401);
    }

    const passwordHash = await hashPassword(newPassword);
    await run(
      env.DB,
      `UPDATE clients
       SET password_hash = ?, password_updated_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [passwordHash, session.client_id],
    );
    // Leave the current browser signed in, but force every other device to
    // authenticate using the new password.
    await run(
      env.DB,
      'DELETE FROM sessions WHERE client_id = ? AND session_id != ?',
      [session.client_id, session.session_id],
    );
    return json({ ok: true, message: 'Password updated. Other devices have been signed out.' });
  } catch (error) {
    console.error(JSON.stringify({ event: 'client_password_change_failed', message: error?.message }));
    return json({ ok: false, error: 'Unable to update your password. Please try again.' }, 500);
  }
}

function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
