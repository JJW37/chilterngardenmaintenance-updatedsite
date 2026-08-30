/**
 * Validation and mapping helpers for the redesigned private portal records.
 * These functions intentionally contain no database or request state so the
 * important client/admin boundary rules can be unit-tested cheaply.
 */

import { validIsoDate } from './invoices.js';

export const VISIT_STATUSES = new Set([
  'scheduled', 'confirmed', 'reschedule_requested', 'completed', 'cancelled',
]);
export const TASK_STATUSES = new Set(['planned', 'in_progress', 'complete', 'flagged']);
export const PRIORITIES = new Set(['essential', 'recommended', 'optional']);
export const PHOTO_CATEGORIES = new Set(['progress', 'before_after', 'reference', 'client_upload']);
export const SPEND_CATEGORIES = new Set(['maintenance', 'materials', 'planting', 'project', 'other']);
export const FEEDBACK_TAGS = new Set([
  'Punctual', 'Careful work', 'Good communication', 'Plant knowledge', 'Tidy finish', 'Helpful advice',
]);

export function positiveId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function cleanText(value, maxLength = 255) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function nullableText(value, maxLength = 255) {
  return cleanText(value, maxLength) || null;
}

/** Accept a YYYY-MM-DD date or a valid ISO-ish local/UTC date-time string. */
export function validScheduleValue(value) {
  const text = cleanText(value, 40);
  if (validIsoDate(text)) return text;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/.test(text)) {
    return null;
  }
  return Number.isNaN(new Date(text).getTime()) ? null : text;
}

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

/** Normalise a short list of labels, rejecting unknown feedback labels when requested. */
export function normaliseTags(value, { max = 12, allowed = null, maxLength = 48 } = {}) {
  const seen = new Set();
  const tags = [];
  for (const raw of parseJsonArray(value)) {
    const tag = cleanText(raw, maxLength);
    if (!tag || (allowed && !allowed.has(tag))) continue;
    const key = tag.toLocaleLowerCase('en-GB');
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === max) break;
  }
  return tags;
}

export function normaliseVisitTasks(value) {
  if (value === undefined || value === null) return { ok: true, tasks: [] };
  if (!Array.isArray(value) || value.length > 20) {
    return { ok: false, error: 'Add up to 20 visit tasks.' };
  }
  const tasks = [];
  for (const raw of value) {
    const title = cleanText(raw?.title, 200);
    if (!title) return { ok: false, error: 'Every visit task needs a title.' };
    const status = TASK_STATUSES.has(raw?.status) ? raw.status : 'planned';
    const priority = PRIORITIES.has(raw?.priority) ? raw.priority : 'recommended';
    tasks.push({
      title,
      detail: nullableText(raw?.detail, 2000),
      area: nullableText(raw?.area, 80),
      status,
      priority,
      planItemId: positiveId(raw?.planItemId),
    });
  }
  return { ok: true, tasks };
}

export function normaliseMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) return null;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function spendCategory(value) {
  const category = cleanText(value, 32).toLowerCase();
  return SPEND_CATEGORIES.has(category) ? category : 'maintenance';
}
