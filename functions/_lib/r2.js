/**
 * CGM Client Portal - R2 image storage helpers
 *
 * R2 binding name (set in wrangler.toml / Pages dashboard): PORTAL_BUCKET
 *
 * Storage layout:
 *   clients/<client_id>/images/<yyyy>/<mm>/<uuid>.<ext>
 *
 * Images are served via the /api/client-image-get?... proxy function so
 * that we can enforce session-based access control (no public URLs).
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/avif',
]);

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/avif': 'avif',
};

export function validateImageFile(file) {
  if (!file) return { ok: false, reason: 'no_file' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: 'too_large' };
  const type = (file.type || '').toLowerCase();
  if (!ALLOWED_TYPES.has(type)) return { ok: false, reason: 'unsupported_type' };
  return { ok: true };
}

/** Build the R2 object key for a new image upload. */
export function buildImageKey(clientId, file) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ext = EXT_BY_TYPE[file.type] || 'bin';
  const uuid = crypto.randomUUID();
  return `clients/${clientId}/images/${yyyy}/${mm}/${uuid}.${ext}`;
}

/** Upload a File/Blob to R2. */
export async function putImage(bucket, key, file) {
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/** Get an image from R2 as a Response (with proper content-type). */
export async function getImageResponse(bucket, key) {
  const obj = await bucket.get(key);
  if (!obj) return null;
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  return new Response(obj.body, { status: 200, headers });
}

/** Delete an image from R2. */
export async function deleteImage(bucket, key) {
  await bucket.delete(key);
}
