import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FEEDBACK_TAGS,
  normaliseTags,
  normaliseVisitTasks,
  positiveId,
  validScheduleValue,
} from '../functions/_lib/portal-records.js';
import { normaliseLineItems } from '../functions/_lib/invoices.js';

test('portal records accept only bounded, well-formed visit work lists', () => {
  const result = normaliseVisitTasks([
    { title: 'Prune hedge', area: 'Front garden', priority: 'essential' },
    { title: 'Clear paths', status: 'complete' },
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.tasks[0], {
    title: 'Prune hedge', detail: null, area: 'Front garden', status: 'planned', priority: 'essential', planItemId: null,
  });
  assert.equal(result.tasks[1].status, 'complete');
  assert.equal(normaliseVisitTasks([{ title: '' }]).ok, false);
  assert.equal(normaliseVisitTasks(new Array(21).fill({ title: 'Too many' })).ok, false);
});

test('schedule values, record ids and feedback tags are normalised defensively', () => {
  assert.equal(validScheduleValue('2026-09-21'), '2026-09-21');
  assert.equal(validScheduleValue('2026-09-21T09:30'), '2026-09-21T09:30');
  assert.equal(validScheduleValue('not a date'), null);
  assert.equal(positiveId('12'), 12);
  assert.equal(positiveId('-1'), null);
  assert.deepEqual(
    normaliseTags(['Punctual', 'Punctual', 'unknown', 'Tidy finish'], { allowed: FEEDBACK_TAGS, max: 6 }),
    ['Punctual', 'Tidy finish'],
  );
});

test('invoice line categories are preserved for the client spend analysis', () => {
  const result = normaliseLineItems([
    { description: 'Compost and plants', quantity: 1, unitPrice: 140, category: 'materials' },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.items[0].category, 'materials');
  assert.equal(normaliseLineItems([{ description: 'Work', quantity: 1, unitPrice: 10, category: 'invalid' }]).ok, false);
});
