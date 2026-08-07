/**
 * DELETE /api/admin-image?id=<imageId>
 *
 * Deletes an image (R2 object + D1 row). Admin only.
 */

import { json, handlePreflight, first, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { deleteImage } from '../_lib/r2.js';

export async function onRequestDelete({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session || session.is_admin !== 1) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    const url = new URL(request.url);
    const imageId = parseInt(url.searchParams.get('id') || '0', 10);
    if (!imageId) {
      return json({ ok: false, error: 'invalid_id' }, 400);
    }

    const img = await first(env.DB, `SELECT id, r2_key FROM images WHERE id = ?`, [imageId]);
    if (!img) {
      return json({ ok: false, error: 'not_found' }, 404);
    }

    // Delete from R2 (best effort) then D1
    try {
      await deleteImage(env.PORTAL_BUCKET, img.r2_key);
    } catch (e) {
      console.error('[admin-image] R2 delete failed (continuing with D1):', e);
    }
    await run(env.DB, `DELETE FROM images WHERE id = ?`, [imageId]);

    return json({ ok: true });
  } catch (err) {
    console.error('[admin-image]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
