/**
 * POST /api/client-image
 * Multipart form-data:
 *   - file:        the image File (max 10 MB, jpg/png/webp/gif/heic/avif)
 *   - caption:     optional caption
 *   - category:    optional - 'progress' | 'before_after' | 'reference' | 'client_upload'
 *                  (clients can only set 'client_upload')
 *   - visitDate:   optional YYYY-MM-DD
 *   - clientId:    optional (admin only - target a specific client)
 *
 * Stores the file in R2 under clients/<id>/images/<yyyy>/<mm>/<uuid>.<ext>
 * and inserts a metadata row in D1.
 *
 * Auth: client session OR admin session.
 */

import { json, handlePreflight, run, first } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { validateImageFile, buildImageKey, putImage } from '../_lib/r2.js';
import { cleanText, normaliseTags, positiveId } from '../_lib/portal-records.js';
import { validIsoDate } from '../_lib/invoices.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) {
      return json({ ok: false, error: 'not_authenticated' }, 401);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const caption = (formData.get('caption') || '').toString().trim().slice(0, 500);
    const visitDate = (formData.get('visitDate') || '').toString().trim() || null;
    const requestedCategory = (formData.get('category') || '').toString();
    const area = cleanText(formData.get('area'), 80) || null;
    const tags = normaliseTags(formData.get('tags'), { max: 12, maxLength: 48 });
    const requestedVisitId = positiveId(formData.get('visitId'));
    const requestedComparisonKey = cleanText(formData.get('comparisonKey'), 80) || null;
    const takenAt = cleanText(formData.get('takenAt'), 10) || null;

    const v = validateImageFile(file);
    if (!v.ok) {
      const reasonMap = {
        no_file: 'No file was uploaded.',
        too_large: 'Image is too large (10 MB max).',
        unsupported_type: 'Unsupported image type. Please use JPG, PNG, WebP, GIF, HEIC or AVIF.',
      };
      return json({ ok: false, error: reasonMap[v.reason] || 'Invalid file.' }, 400);
    }
    if (visitDate && !validIsoDate(visitDate)) return json({ ok: false, error: 'Visit date must use YYYY-MM-DD.' }, 400);
    if (takenAt && !validIsoDate(takenAt)) return json({ ok: false, error: 'Photo date must use YYYY-MM-DD.' }, 400);

    let clientId;
    let uploaderType;
    let uploaderName;
    let category;
    let visitId = null;
    let comparisonKey = null;

    if (session.is_admin === 1) {
      uploaderType = 'admin';
      uploaderName = 'Chiltern Garden Maintenance';
      clientId = formData.get('clientId') ? parseInt(formData.get('clientId'), 10) : null;
      if (!clientId) {
        return json({ ok: false, error: 'clientId is required for admin uploads.' }, 400);
      }
      category = ['progress', 'before_after', 'reference', 'client_upload'].includes(requestedCategory)
        ? requestedCategory
        : 'progress';
      visitId = requestedVisitId;
      comparisonKey = requestedComparisonKey;
    } else {
      uploaderType = 'client';
      clientId = session.client_id;
      const client = await first(env.DB, `SELECT household_name FROM clients WHERE id = ?`, [clientId]);
      uploaderName = client?.household_name || 'Client';
      // Clients can only upload to 'client_upload' bucket
      category = 'client_upload';
    }

    // Verify client exists
    const client = await first(env.DB, `SELECT id FROM clients WHERE id = ? AND is_active = 1`, [clientId]);
    if (!client) {
      return json({ ok: false, error: 'client_not_found' }, 404);
    }
    if (visitId) {
      const visit = await first(env.DB, 'SELECT id FROM visits WHERE id = ? AND client_id = ?', [visitId, clientId]);
      if (!visit) return json({ ok: false, error: 'The selected visit does not belong to this household.' }, 400);
    }

    // Build R2 key & upload
    const r2Key = buildImageKey(clientId, file);
    await putImage(env.PORTAL_BUCKET, r2Key, file);

    // Insert metadata row
    const result = await run(
      env.DB,
      `INSERT INTO images (client_id, uploader_type, uploader_name, r2_key, filename, mime_type, size_bytes, caption, category, visit_date, visit_id, area, tags_json, comparison_key, taken_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        uploaderType,
        uploaderName,
        r2Key,
        file.name || 'upload',
        file.type,
        file.size,
        caption || null,
        category,
        visitDate,
        visitId,
        area,
        JSON.stringify(tags),
        comparisonKey,
        takenAt,
      ],
    );

    const imageId = result.meta?.last_row_id;

    return json({
      ok: true,
      image: {
        id: imageId,
        uploaderType,
        uploaderName,
        filename: file.name || 'upload',
        mimeType: file.type,
        sizeBytes: file.size,
        caption,
        category,
        visitDate,
        visitId,
        area,
        tags,
        comparisonKey,
        takenAt,
        createdAt: new Date().toISOString(),
        url: `/api/client-image-get?id=${imageId}`,
      },
    });
  } catch (err) {
    console.error('[client-image]', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
