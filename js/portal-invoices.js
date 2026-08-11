/* Private household invoice record. */
(function () {
  'use strict';
  var context;
  var $ = function (id) { return document.getElementById(id); };
  var money = function (value) { return '£' + Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var escapeHtml = function (value) { return window.CGMPortal.escapeHtml(value); };
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      context = await window.CGMPortal.getContext();
      if (!context) return window.CGMPortal.showPageState('unauthorised');
      if (context.needsClientSelection) return window.CGMPortal.showClientSelection();
      window.CGMPortal.setupNavigation(context, 'invoices');
      var data = await getInvoices();
      $('householdLabel').textContent = data.client.householdName;
      if (context.isAdmin) $('adminBanner').hidden = false;
      renderList(data.invoices || []);
      window.CGMPortal.showPageState('content');
    } catch (error) { console.error('[portal-invoices]', error); window.CGMPortal.showPageState('unauthorised'); }
  }

  function clientSuffix() { return context.isAdmin ? '?clientId=' + encodeURIComponent(context.clientId) : ''; }
  async function getInvoices(id) { var query = new URLSearchParams(); if (id) query.set('id', id); if (context.isAdmin) query.set('clientId', context.clientId); var response = await fetch('/api/client-invoices' + (query.toString() ? '?' + query : ''), { credentials: 'include' }); var data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to load invoices.'); return data; }
  function date(value) { return window.CGMPortal.formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' }); }
  function badge(status) { return '<span class="invoice-status invoice-status-' + escapeHtml(status) + '">' + escapeHtml({ sent: 'Sent', partial: 'Part paid', paid: 'Paid', overdue: 'Overdue' }[status] || status) + '</span>'; }
  function renderList(invoices) {
    var body = $('invoicePageBody');
    if (!invoices.length) { body.innerHTML = '<section class="portal-section"><div class="empty-state"><div class="es-icon">£</div><h3>No invoices yet</h3><p>When CGM issues an invoice, it will appear here with its payment details.</p></div></section>'; return; }
    body.innerHTML = '<div class="portal-stat-grid"><div class="portal-stat"><span>Invoices</span><strong>' + invoices.length + '</strong></div><div class="portal-stat"><span>Outstanding</span><strong>' + money(invoices.filter(function (invoice) { return invoice.status !== 'paid'; }).reduce(function (sum, invoice) { return sum + Number(invoice.balanceDue || 0); }, 0)) + '</strong></div><div class="portal-stat"><span>Paid</span><strong>' + invoices.filter(function (invoice) { return invoice.status === 'paid'; }).length + '</strong></div></div><section class="portal-section"><div class="section-heading-row"><div><h2>Invoice record</h2><p>Select an invoice for its full breakdown, PDF and bank-transfer details.</p></div></div><div class="invoice-client-list">' + invoices.map(function (invoice) { return '<button class="invoice-client-card" type="button" data-invoice-id="' + invoice.id + '"><span><strong>' + escapeHtml(invoice.invoiceNumber) + '</strong><small>Issued ' + date(invoice.issueDate) + ' · Due ' + date(invoice.dueDate) + '</small></span><span class="invoice-client-card-side"><strong>' + money(invoice.total) + '</strong>' + badge(invoice.status) + '</span></button>'; }).join('') + '</div></section>';
    body.querySelectorAll('[data-invoice-id]').forEach(function (button) { button.addEventListener('click', function () { openInvoice(button.dataset.invoiceId); }); });
  }
  async function openInvoice(id) {
    try { var data = await getInvoices(id); renderDetail(data.invoice, data.items || [], data.payments || [], data.bankDetails); } catch (error) { showError(error.message || 'Unable to open this invoice.'); }
  }
  function renderDetail(invoice, items, payments, bank) {
    var body = $('invoicePageBody'); var balance = Number(invoice.balanceDue || 0); var outstanding = !['paid', 'cancelled'].includes(invoice.status) && balance > 0;
    var rows = items.map(function (item) { return '<tr><td>' + escapeHtml(item.description) + '</td><td class="amount">' + item.quantity + '</td><td class="amount">' + money(item.unit_price) + '</td><td class="amount">' + money(item.line_total) + '</td></tr>'; }).join('');
    var paymentsHtml = payments.length ? '<div class="invoice-payments"><h3>Payments received</h3>' + payments.map(function (payment) { return '<div><span>' + date(payment.paid_date) + ' · ' + escapeHtml(payment.payment_method.replace(/_/g, ' ')) + '</span><strong>' + money(payment.amount) + '</strong></div>'; }).join('') + '</div>' : '';
    var pdf = invoice.hasPdf ? '<a class="btn-portal btn-ghost" href="/api/client-invoice-pdf?id=' + invoice.id + (context.isAdmin ? '&clientId=' + encodeURIComponent(context.clientId) : '') + '">Download PDF</a>' : '';
    body.innerHTML = '<section class="portal-section invoice-client-detail"><button id="backToInvoices" class="btn-portal btn-ghost btn-compact" type="button">← All invoices</button><div class="invoice-detail-head"><div><span class="portal-badge">Invoice</span><h2>' + escapeHtml(invoice.invoiceNumber) + '</h2><p>' + (invoice.reference ? escapeHtml(invoice.reference) + ' · ' : '') + 'Issued ' + date(invoice.issueDate) + ' · Payment due ' + date(invoice.dueDate) + '</p></div>' + badge(invoice.status) + '</div>' + (invoice.notes ? '<div class="invoice-note"><strong>Note from CGM</strong><p>' + escapeHtml(invoice.notes) + '</p></div>' : '') + '<div class="invoice-table-wrap"><table class="invoice-table"><thead><tr><th>Description</th><th class="amount">Qty</th><th class="amount">Unit price</th><th class="amount">Total</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><th colspan="3">Subtotal</th><th class="amount">' + money(invoice.subtotal) + '</th></tr>' + (Number(invoice.vatAmount) ? '<tr><th colspan="3">VAT (' + (Number(invoice.vatRate) * 100).toFixed(0) + '%)</th><th class="amount">' + money(invoice.vatAmount) + '</th></tr>' : '') + '<tr class="invoice-grand-total"><th colspan="3">Total</th><th class="amount">' + money(invoice.total) + '</th></tr><tr><th colspan="3">Paid</th><th class="amount">' + money(invoice.amountPaid) + '</th></tr><tr class="invoice-balance"><th colspan="3">Balance due</th><th class="amount">' + money(balance) + '</th></tr></tfoot></table></div>' + pdf + paymentsHtml + (outstanding ? renderPayPanel(invoice, bank, balance) : '') + '</section>';
    $('backToInvoices').addEventListener('click', init);
    body.querySelectorAll('[data-copy-value]').forEach(function (button) { button.addEventListener('click', copyValue); });
  }
  function renderPayPanel(invoice, bank, balance) {
    if (!bank) return '<div class="invoice-payment-panel"><h3>Payment details being prepared</h3><p>Please contact CGM if you need to arrange payment before the details appear here.</p></div>';
    var row = function (label, value, id) { return '<div class="invoice-pay-row"><span>' + label + '</span><strong id="' + id + '">' + escapeHtml(value) + '</strong><button type="button" class="btn-portal btn-ghost btn-compact" data-copy-value="' + id + '">Copy</button></div>'; };
    return '<div class="invoice-payment-panel"><div><span class="portal-badge">Bank transfer</span><h3>Pay by bank transfer</h3><p>Use <strong>' + escapeHtml(invoice.invoiceNumber) + '</strong> as the payment reference. CGM will confirm once the payment has been received.</p></div>' + row('Account name', bank.account_name, 'bank-account-name') + row('Sort code', bank.sort_code, 'bank-sort-code') + row('Account number', bank.account_number, 'bank-account-number') + row('Payment reference', invoice.invoiceNumber, 'bank-payment-reference') + '<div class="invoice-pay-row total"><span>Amount due</span><strong>' + money(balance) + '</strong></div></div>';
  }
  async function copyValue(event) { var button = event.currentTarget; var value = $(button.dataset.copyValue).textContent; try { await navigator.clipboard.writeText(value); var original = button.textContent; button.textContent = 'Copied'; setTimeout(function () { button.textContent = original; }, 1200); } catch (_) { showError('Unable to copy automatically. Please select the detail and copy it manually.'); } }
  function showError(message) { var alert = $('invoicePageAlert'); alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = message; }
}());
