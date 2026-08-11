/**
 * Invoice-specific validation and calculation helpers.
 *
 * Monetary values are kept as two-decimal GBP values at the database boundary.
 * The portal is currently not VAT registered, so the UI defaults to 0%; the
 * capability remains here for when that changes.
 */

const MAX_LINE_ITEMS = 50;
const MAX_DESCRIPTION_LENGTH = 500;

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function validIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normaliseVatRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) return null;
  return rate;
}

export function normaliseLineItems(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_LINE_ITEMS) {
    return { ok: false, error: 'Add between 1 and 50 invoice line items.' };
  }

  const items = [];
  for (const rawItem of value) {
    const description = String(rawItem?.description || '').trim();
    const quantity = Number(rawItem?.quantity);
    const unitPrice = Number(rawItem?.unitPrice);
    if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
      return { ok: false, error: 'Each line item needs a description of up to 500 characters.' };
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) {
      return { ok: false, error: 'Each line-item quantity must be greater than zero.' };
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 10000000) {
      return { ok: false, error: 'Each unit price must be a valid non-negative amount.' };
    }
    const cleanQuantity = roundMoney(quantity);
    const cleanUnitPrice = roundMoney(unitPrice);
    items.push({
      description,
      quantity: cleanQuantity,
      unitPrice: cleanUnitPrice,
      lineTotal: roundMoney(cleanQuantity * cleanUnitPrice),
    });
  }
  return { ok: true, items };
}

export function calculateInvoiceTotals(items, vatRate) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const vatAmount = roundMoney(subtotal * vatRate);
  return { subtotal, vatAmount, total: roundMoney(subtotal + vatAmount) };
}

/** Generate the first available CGM invoice number for a calendar year. */
export function nextInvoiceNumber(lastInvoiceNumber, year = new Date().getUTCFullYear()) {
  const prefix = `CGM-${year}-`;
  const match = typeof lastInvoiceNumber === 'string'
    ? lastInvoiceNumber.match(new RegExp(`^CGM-${year}-(\\d{4,})$`))
    : null;
  const next = match ? Number.parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function invoiceStatusForPayment(total, amountPaid) {
  if (roundMoney(amountPaid) >= roundMoney(total)) return 'paid';
  if (roundMoney(amountPaid) > 0) return 'partial';
  return 'sent';
}
