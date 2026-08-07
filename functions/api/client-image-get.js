/**
 * GET /api/client-image-get?id=<imageId>
 *
 * Returns the raw image bytes from R2, gated by session auth.
 * The requester must be:
 *   - The client who owns the image, OR
 *   - An admin
 *
 * Cache-Control is set to "private" so CDNs/proxies won't cache it
 * across users.
 */

import { json, handlePreflight, first } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { getImageResponse } from '../_lib/r2.js';

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) {
      return json({ ok: false, error: 'not_authenticated' }, 401);
    }

    const url = new URL(request.url);
    const imageId = parseInt(url.searchParams.get('id') || '0', 10);
    if (!imageId) {
      return json({ ok: false, error: 'invalid_id' }, 400);
    }

    const img = await first(
      env.DB,
      `SELECT id, client_id, r2_key, mime_type FROM images WHERE id = ?`,
      [imageId],
    );

    if (!img) {
      return json({ ok: false, error: 'not_found' }, 404);
    }

    // Authorize: client must own it, OR admin
    if (session.is_admin !== 1 && session.client_id !== img.client_id) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    const r2Response = await getImageResponse(env.PORTAL_BUCKET, img.r2_key);
    if (!r2Response) {
      return json({ ok: false, error: 'file_missing' }, 404);
    }
    return r2Response;
  } catch (err) {
    console.error('[client-image-get]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
