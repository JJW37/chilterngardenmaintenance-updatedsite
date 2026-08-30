/**
 * Admin-only Garden Plan management.
 *
 * POST   /api/admin-plan   creates a plan item
 * PATCH  /api/admin-plan   updates a plan item
 * DELETE /api/admin-plan?id=<planItemId> removes a plan item
 *
 * Plan items remain client-readable, but clients never receive a route that
 * can create or alter them. This keeps CGM's seasonal direction authoritative.
 */

import { json, handlePreflight, first, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';

const STATUSES = new Set(['planned', 'in_progress', 'complete']);
const PRIORITIES = new Set(['essential', 'recommended', 'optional']);
const MAX_TITLE = 200;
const MAX_DETAIL = 8000;
const MAX_SEASON = 80;
const MAX_AREA = 80;

function text(value, max) {
  return (value || '').toString().trim().slice(0, max);
}

function nullableDate(value) {
  const date = text(value, 10);
  if (!date) return { ok: true, value: null };
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? { ok: true, value: date }
    : { ok: false, error: 'Target date must use YYYY-MM-DD.' };
}

async function requireAdmin(request, env) {
  const session = await getSessionFromRequest(env.DB, env, request);
  return session && session.is_admin === 1 ? session : null;
}

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    if (!await requireAdmin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const body = await request.json().catch(() => ({}));
    const clientId = Number.parseInt(body.clientId, 10);
    const title = text(body.title, MAX_TITLE);
    const detail = text(body.detail, MAX_DETAIL) || null;
    const season = text(body.season, MAX_SEASON) || 'All year';
    const status = STATUSES.has(body.status) ? body.status : 'planned';
    const priority = PRIORITIES.has(body.priority) ? body.priority : 'recommended';
    const targetDate = nullableDate(body.targetDate);
    const area = text(body.area, MAX_AREA) || null;

    if (!clientId || !title) return json({ ok: false, error: 'Client and plan title are required.' }, 400);
    if (!targetDate.ok) return json({ ok: false, error: targetDate.error }, 400);
    const client = await first(env.DB, 'SELECT id FROM clients WHERE id = ?', [clientId]);
    if (!client) return json({ ok: false, error: 'client_not_found' }, 404);

    const result = await run(
      env.DB,
      `INSERT INTO garden_plan_items (client_id, season, title, detail, status, priority, target_date, area)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, season, title, detail, status, priority, targetDate.value, area],
    );
    return json({ ok: true, id: result.meta?.last_row_id });
  } catch (error) {
    console.error('[admin-plan:create]', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    if (!await requireAdmin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const body = await request.json().catch(() => ({}));
    const id = Number.parseInt(body.id, 10);
    if (!id) return json({ ok: false, error: 'Plan item id is required.' }, 400);
    const item = await first(env.DB, 'SELECT id FROM garden_plan_items WHERE id = ?', [id]);
    if (!item) return json({ ok: false, error: 'plan_item_not_found' }, 404);

    const fields = [];
    const values = [];
    if (body.title !== undefined) {
      const value = text(body.title, MAX_TITLE);
      if (!value) return json({ ok: false, error: 'Plan title cannot be empty.' }, 400);
      fields.push('title = ?'); values.push(value);
    }
    if (body.detail !== undefined) { fields.push('detail = ?'); values.push(text(body.detail, MAX_DETAIL) || null); }
    if (body.season !== undefined) { fields.push('season = ?'); values.push(text(body.season, MAX_SEASON) || 'All year'); }
    if (body.status !== undefined) {
      if (!STATUSES.has(body.status)) return json({ ok: false, error: 'Invalid plan status.' }, 400);
      fields.push('status = ?'); values.push(body.status);
    }
    if (body.priority !== undefined) {
      if (!PRIORITIES.has(body.priority)) return json({ ok: false, error: 'Invalid plan priority.' }, 400);
      fields.push('priority = ?'); values.push(body.priority);
    }
    if (body.targetDate !== undefined) {
      const targetDate = nullableDate(body.targetDate);
      if (!targetDate.ok) return json({ ok: false, error: targetDate.error }, 400);
      fields.push('target_date = ?'); values.push(targetDate.value);
    }
    if (body.area !== undefined) { fields.push('area = ?'); values.push(text(body.area, MAX_AREA) || null); }
    if (!fields.length) return json({ ok: false, error: 'No plan changes supplied.' }, 400);

    fields.push("updated_at = datetime('now')");
    values.push(id);
    await run(env.DB, `UPDATE garden_plan_items SET ${fields.join(', ')} WHERE id = ?`, values);
    return json({ ok: true });
  } catch (error) {
    console.error('[admin-plan:update]', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    if (!await requireAdmin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const id = Number.parseInt(new URL(request.url).searchParams.get('id') || '0', 10);
    if (!id) return json({ ok: false, error: 'Plan item id is required.' }, 400);
    const result = await run(env.DB, 'DELETE FROM garden_plan_items WHERE id = ?', [id]);
    if (!result.meta?.changes) return json({ ok: false, error: 'plan_item_not_found' }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error('[admin-plan:delete]', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
