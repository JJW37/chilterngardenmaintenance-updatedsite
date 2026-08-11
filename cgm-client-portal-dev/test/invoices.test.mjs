import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateInvoiceTotals,
  invoiceStatusForPayment,
  nextInvoiceNumber,
  normaliseLineItems,
  normaliseVatRate,
  validIsoDate,
} from '../functions/_lib/invoices.js';

test('normalises invoice line items and calculates VAT accurately', () => {
  const result = normaliseLineItems([
    { description: 'Garden maintenance — August', quantity: '8', unitPrice: '40' },
    { description: 'Mushroom compost', quantity: 2, unitPrice: 85.5 },
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(calculateInvoiceTotals(result.items, normaliseVatRate(0.2)), {
    subtotal: 491,
    vatAmount: 98.2,
    total: 589.2,
  });
});

test('rejects invalid invoice values instead of silently turning them into zero', () => {
  assert.equal(normaliseLineItems([{ description: 'Work', quantity: 0, unitPrice: 40 }]).ok, false);
  assert.equal(normaliseLineItems([{ description: '', quantity: 1, unitPrice: 40 }]).ok, false);
  assert.equal(normaliseVatRate(1.01), null);
  assert.equal(validIsoDate('2026-02-29'), false);
  assert.equal(validIsoDate('2028-02-29'), true);
});

test('generates sequential CGM invoice numbers and correct payment states', () => {
  assert.equal(nextInvoiceNumber(null, 2026), 'CGM-2026-0001');
  assert.equal(nextInvoiceNumber('CGM-2026-0042', 2026), 'CGM-2026-0043');
  assert.equal(nextInvoiceNumber('CGM-2025-0142', 2026), 'CGM-2026-0001');
  assert.equal(invoiceStatusForPayment(1200, 0), 'sent');
  assert.equal(invoiceStatusForPayment(1200, 500), 'partial');
  assert.equal(invoiceStatusForPayment(1200, 1200), 'paid');
});
