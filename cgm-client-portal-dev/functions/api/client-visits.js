/**
 * Operational visit schedule and work-list API.
 *
 * GET  /api/client-visits?clientId= (admin only selector)
 * POST /api/client-visits
 *   Admin:  { action: 'create'|'update'|'delete'|'task-update', ... }
 *   Client: { action: 'confirm'|'request-reschedule', visitId, message? }
 *
 * A client can never create, edit or complete a CGM visit. They can only
 * confirm a proposed visit or make a visible reschedule request for their own
 * household. Staff use the same portal in admin-view to manage the schedule.
 */

import { all, first, handlePreflight, json, run } from '../_lib/db.js';
import { getSessionFromRequest } from '../_lib/auth.js';
import {
  cleanText,
  normaliseVisitTasks,
  nullableText,
  positiveId,
  PRIORITIES,
  TASK_STATUSES,
  validScheduleValue,
  VISIT_STATUSES,
} from '../_lib/portal-records.js';

function tagsFromJson(value) {
  try { return Array.isArray(JSON.parse(value || '[]')) ? JSON.parse(value || '[]') : []; } catch (_) { return []; }
}

function mapVisit(row, tasksByVisit, feedbackByVisit) {
  const feedback = feedbackByVisit.get(row.id);
  return {
    id: row.id,
    scheduledStart: row.scheduled_start,
    arrivalWindow: row.arrival_window,
    gardenerName: row.gardener_name,
    status: row.status,
    summary: row.summary,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks: (tasksByVisit.get(row.id) || []).map((task) => ({
      id: task.id,
      planItemId: task.plan_item_id,
      title: task.title,
      detail: task.detail,
      area: task.area,
      status: task.status,
      priority: task.priority,
      completedAt: task.completed_at,
    })),
    feedback: feedback ? {
      id: feedback.id,
      rating: feedback.rating,
      tags: tagsFromJson(feedback.tags_json),
      comment: feedback.comment,
      submittedAt: feedback.submitted_at,
      updatedAt: feedback.updated_at,
    } : null,
  };
}

export async function loadVisits(db, clientId) {
  const [rows, taskRows, feedbackRows] = await Promise.all([
    all(db, `SELECT id, scheduled_start, arrival_window, gardener_name, status, summary, completed_at, created_at, updated_at
             FROM visits WHERE client_id = ? ORDER BY scheduled_start DESC, id DESC`, [clientId]),
    all(db, `SELECT id, visit_id, plan_item_id, title, detail, area, status, priority, sort_order, completed_at
             FROM visit_tasks WHERE client_id = ? ORDER BY visit_id, sort_order, id`, [clientId]),
    all(db, `SELECT id, visit_id, rating, tags_json, comment, submitted_at, updated_at
             FROM visit_feedback WHERE client_id = ?`, [clientId]),
  ]);
  const tasksByVisit = new Map();
  for (const task of taskRows) {
    const tasks = tasksByVisit.get(task.visit_id) || [];
    tasks.push(task);
    tasksByVisit.set(task.visit_id, tasks);
  }
  const feedbackByVisit = new Map(feedbackRows.map((feedback) => [feedback.visit_id, feedback]));
  return rows.map((row) => mapVisit(row, tasksByVisit, feedbackByVisit));
}

async function scope(request, env, requestedClientId) {
  const session = await getSessionFromRequest(env.DB, env, request);
  if (!session) return { error: json({ ok: false, error: 'not_authenticated' }, 401) };
  const clientId = session.is_admin === 1 ? positiveId(requestedClientId) : positiveId(session.client_id);
  if (!clientId) return { error: json({ ok: false, error: 'clientId is required.' }, 400) };
  const client = await first(env.DB, 'SELECT id, household_name, is_active FROM clients WHERE id = ?', [clientId]);
  if (!client || client.is_active !== 1) return { error: json({ ok: false, error: 'client_not_found' }, 404) };
  return { session, clientId, client };
}

async function getVisitForScope(db, visitId, clientId) {
  return first(db, 'SELECT id, client_id, status FROM visits WHERE id = ? AND client_id = ?', [visitId, clientId]);
}

export async function onRequestGet({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const url = new URL(request.url);
    const resolved = await scope(request, env, url.searchParams.get('clientId'));
    if (resolved.error) return resolved.error;
    return json({ ok: true, visits: await loadVisits(env.DB, resolved.clientId) });
  } catch (error) {
    console.error('[client-visits:get]', error);
    return json({ ok: false, error: 'Unable to load visit records.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  try {
    const body = await request.json().catch(() => ({}));
    const resolved = await scope(request, env, body.clientId);
    if (resolved.error) return resolved.error;
    const { session, clientId, client } = resolved;
    const action = cleanText(body.action, 40);
    const visitId = positiveId(body.visitId || body.id);

    if (session.is_admin !== 1) {
      if (!visitId || !['confirm', 'request-reschedule'].includes(action)) {
        return json({ ok: false, error: 'This visit action is not available.' }, 403);
      }
      const visit = await getVisitForScope(env.DB, visitId, clientId);
      if (!visit || ['completed', 'cancelled'].includes(visit.status)) {
        return json({ ok: false, error: 'This visit can no longer be changed.' }, 404);
      }
      if (action === 'confirm') {
        await run(env.DB, `UPDATE visits SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?`, [visitId]);
        return json({ ok: true, status: 'confirmed' });
      }
      const message = cleanText(body.message, 2000);
      if (!message) return json({ ok: false, error: 'Tell CGM what needs to change.' }, 400);
      await run(env.DB, `UPDATE visits SET status = 'reschedule_requested', updated_at = datetime('now') WHERE id = ?`, [visitId]);
      await run(
        env.DB,
        `INSERT INTO portal_messages (client_id, sender_type, sender_name, body, visit_id)
         VALUES (?, 'client', ?, ?, ?)`,
        [clientId, client.household_name, `Reschedule request: ${message}`, visitId],
      );
      return json({ ok: true, status: 'reschedule_requested' });
    }

    if (!['create', 'update', 'delete', 'task-update'].includes(action)) {
      return json({ ok: false, error: 'Unknown visit action.' }, 400);
    }

    if (action === 'create') {
      const scheduledStart = validScheduleValue(body.scheduledStart);
      const arrivalWindow = nullableText(body.arrivalWindow, 120);
      const gardenerName = nullableText(body.gardenerName, 120);
      const summary = nullableText(body.summary, 8000);
      const status = VISIT_STATUSES.has(body.status) ? body.status : 'scheduled';
      const tasks = normaliseVisitTasks(body.tasks);
      if (!scheduledStart) return json({ ok: false, error: 'Choose a valid visit date or time.' }, 400);
      if (!tasks.ok) return json({ ok: false, error: tasks.error }, 400);
      const created = await run(
        env.DB,
        `INSERT INTO visits (client_id, scheduled_start, arrival_window, gardener_name, status, summary, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [clientId, scheduledStart, arrivalWindow, gardenerName, status, summary, status === 'completed' ? new Date().toISOString() : null],
      );
      const newVisitId = created.meta?.last_row_id;
      if (!newVisitId) throw new Error('D1 did not return a visit identifier.');
      for (let index = 0; index < tasks.tasks.length; index += 1) {
        const task = tasks.tasks[index];
        await run(
          env.DB,
          `INSERT INTO visit_tasks (visit_id, client_id, plan_item_id, title, detail, area, status, priority, sort_order, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newVisitId, clientId, task.planItemId, task.title, task.detail, task.area, task.status, task.priority, index, task.status === 'complete' ? new Date().toISOString() : null],
        );
      }
      return json({ ok: true, id: newVisitId }, 201);
    }

    if (!visitId) return json({ ok: false, error: 'Choose a visit.' }, 400);
    const visit = await getVisitForScope(env.DB, visitId, clientId);
    if (!visit) return json({ ok: false, error: 'visit_not_found' }, 404);

    if (action === 'delete') {
      await run(env.DB, 'DELETE FROM visits WHERE id = ? AND client_id = ?', [visitId, clientId]);
      return json({ ok: true });
    }

    if (action === 'update') {
      const fields = [];
      const values = [];
      if (body.scheduledStart !== undefined) {
        const value = validScheduleValue(body.scheduledStart);
        if (!value) return json({ ok: false, error: 'Choose a valid visit date or time.' }, 400);
        fields.push('scheduled_start = ?'); values.push(value);
      }
      if (body.arrivalWindow !== undefined) { fields.push('arrival_window = ?'); values.push(nullableText(body.arrivalWindow, 120)); }
      if (body.gardenerName !== undefined) { fields.push('gardener_name = ?'); values.push(nullableText(body.gardenerName, 120)); }
      if (body.summary !== undefined) { fields.push('summary = ?'); values.push(nullableText(body.summary, 8000)); }
      if (body.status !== undefined) {
        if (!VISIT_STATUSES.has(body.status)) return json({ ok: false, error: 'Invalid visit status.' }, 400);
        fields.push('status = ?'); values.push(body.status);
        if (body.status === 'completed') { fields.push("completed_at = COALESCE(completed_at, datetime('now'))"); }
        else { fields.push('completed_at = NULL'); }
      }
      if (!fields.length) return json({ ok: false, error: 'No visit changes supplied.' }, 400);
      fields.push("updated_at = datetime('now')");
      values.push(visitId, clientId);
      await run(env.DB, `UPDATE visits SET ${fields.join(', ')} WHERE id = ? AND client_id = ?`, values);
      return json({ ok: true });
    }

    const taskId = positiveId(body.taskId);
    if (!taskId) return json({ ok: false, error: 'Choose a visit task.' }, 400);
    const task = await first(env.DB, 'SELECT id FROM visit_tasks WHERE id = ? AND visit_id = ? AND client_id = ?', [taskId, visitId, clientId]);
    if (!task) return json({ ok: false, error: 'visit_task_not_found' }, 404);
    const fields = [];
    const values = [];
    if (body.title !== undefined) {
      const value = cleanText(body.title, 200);
      if (!value) return json({ ok: false, error: 'Task title cannot be empty.' }, 400);
      fields.push('title = ?'); values.push(value);
    }
    if (body.detail !== undefined) { fields.push('detail = ?'); values.push(nullableText(body.detail, 2000)); }
    if (body.area !== undefined) { fields.push('area = ?'); values.push(nullableText(body.area, 80)); }
    if (body.priority !== undefined) {
      if (!PRIORITIES.has(body.priority)) return json({ ok: false, error: 'Invalid task priority.' }, 400);
      fields.push('priority = ?'); values.push(body.priority);
    }
    if (body.status !== undefined) {
      if (!TASK_STATUSES.has(body.status)) return json({ ok: false, error: 'Invalid task status.' }, 400);
      fields.push('status = ?'); values.push(body.status);
      if (body.status === 'complete') fields.push("completed_at = COALESCE(completed_at, datetime('now'))");
      else fields.push('completed_at = NULL');
    }
    if (!fields.length) return json({ ok: false, error: 'No task changes supplied.' }, 400);
    fields.push("updated_at = datetime('now')");
    values.push(taskId);
    await run(env.DB, `UPDATE visit_tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    return json({ ok: true });
  } catch (error) {
    console.error('[client-visits:post]', error);
    return json({ ok: false, error: 'Unable to update the visit record.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return handlePreflight(request) || new Response(null, { status: 204 });
}
