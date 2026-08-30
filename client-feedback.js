/** POST /api/client-feedback — a household's feedback on one completed visit. */

import { first, handlePreflight, json, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import { cleanText, FEEDBACK_TAGS, normaliseTags, positiveId } from '../_lib/portal-records.js';

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const session = await getSessionFromRequest(env.DB, env, request);
    if (!session) return json({ ok: false, error: 'not_authenticated' }, 401);
    if (session.is_admin === 1) return json({ ok: false, error: 'Only the household can submit visit feedback.' }, 403);

    const body = await request.json().catch(() => ({}));
    const visitId = positiveId(body.visitId);
    const rating = Number.parseInt(body.rating, 10);
    const tags = normaliseTags(body.tags, { max: 6, allowed: FEEDBACK_TAGS, maxLength: 40 });
    const comment = cleanText(body.comment, 2000) || null;
    if (!visitId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return json({ ok: false, error: 'Choose a rating from 1 to 5 stars.' }, 400);
    }
    const visit = await first(
      env.DB,
      `SELECT id FROM visits WHERE id = ? AND client_id = ? AND status = 'completed'`,
      [visitId, session.client_id],
    );
    if (!visit) return json({ ok: false, error: 'Feedback is available after a completed visit.' }, 404);

    await run(
      env.DB,
      `INSERT INTO visit_feedback (client_id, visit_id, rating, tags_json, comment)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(visit_id) DO UPDATE SET
         rating = excluded.rating,
         tags_json = excluded.tags_json,
         comment = excluded.comment,
         updated_at = datetime('now')`,
      [session.client_id, visitId, rating, JSON.stringify(tags), comment],
    );
    return json({ ok: true, feedback: { visitId, rating, tags, comment } });
  } catch (error) {
    console.error('[client-feedback]', error);
    return json({ ok: false, error: 'Unable to save feedback.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
