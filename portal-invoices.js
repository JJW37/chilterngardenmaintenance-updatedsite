/* Private invoice record, spend analysis and safe bank-transfer workflow. */
(function () {
  'use strict';

  var state = { context: null, list: null, filter: 'all' };
  var $ = function (id) { return document.getElementById(id); };
  var escapeHtml = function (value) { return window.CGMPortal.escapeHtml(value); };
  var money = function (value) { return '£' + Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var date = function (value) { return window.CGMPortal.formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' }); };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      state.context = await window.CGMPortal.getContext();
      if (!state.context) return window.CGMPortal.showPageState('unauthorised');
      if (state.context.needsClientSelection) return window.CGMPortal.showClientSelection();
      state.list = await getInvoices();
      renderShell(); renderList();
      window.CGMPortal.showPageState('content');
    } catch (error) {
      console.error('[portal-invoices]', error);
      window.CGMPortal.showPageState('unauthorised');
    }
  }

  function clientQuery() { return window.CGMPortal.clientQuery(state.context); }

  async function getInvoices(id) {
    var query = new URLSearchParams();
    if (id) query.set('id', id);
    if (state.context.isAdmin) query.set('clientId', state.context.clientId);
    var response = await fetch('/api/client-invoices' + (query.toString() ? '?' + query.toString() : ''), { credentials: 'include' });
    var result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load invoices.');
    return result;
  }

  function nav() {
    var links = [
      ['overview', '/portal/', 'Overview'], ['history', '/portal/history/', 'Visit history'], ['plan', '/portal/plan/', 'Garden plan'], ['photos', '/portal/photos/', 'Photos'], ['messages', '/portal/messages/', 'Messages'], ['invoices', '/portal/invoices/', 'Invoices'], ['account', '/portal/account/', 'Account'],
    ];
    return '<nav id="portalNav" class="portal-nav passport-nav" aria-label="Your Garden Passport">' + links.map(function (link) { return '<a data-portal-path="' + link[1] + '" data-portal-key="' + link[0] + '"' + (link[0] === 'invoices' ? ' aria-current="page"' : '') + '>' + link[2] + '</a>'; }).join('') + '</nav>';
  }

  function renderShell() {
    var client = state.list.client;
    document.title = 'Invoices | ' + client.householdName + ' | CGM';
    $('portalContent').innerHTML =
      (state.context.isAdmin ? '<div id="adminBanner" class="alert alert-info passport-admin-banner"><strong>Admin view.</strong> You are viewing this household’s private invoice record. <a href="/portal/admin/dashboard/">Back to dashboard</a></div>' : '') +
      '<div class="passport-page-header"><div><span class="eyebrow">Private Garden Passport</span><h1>Invoices &amp; spending</h1><p>Clear invoice records, payment status and a truthful view of work categories over time.</p></div><div class="passport-header-meta"><span class="portal-badge">' + escapeHtml(client.householdName) + '</span><span>Bank transfer only</span></div></div>' + nav() + '<div id="invoicePageAlert" class="alert" hidden></div><div id="invoicePageBody"></div>';
    window.CGMPortal.setupNavigation(state.context, 'invoices');
  }

  function renderList() {
    var invoices = state.list.invoices || [];
    var body = $('invoicePageBody');
    if (!invoices.length) {
      body.innerHTML = '<section class="passport-section"><div class="passport-empty"><span>£</span><h3>No invoices yet</h3><p>When CGM issues an invoice, it will appear here with its itemised breakdown and secure bank-transfer details.</p></div></section>';
      return;
    }
    var outstanding = invoices.filter(isOutstanding);
    var paid = invoices.filter(function (invoice) { return invoice.status === 'paid'; });
    var paidTotal = paid.reduce(function (sum, invoice) { return sum + Number(invoice.amountPaid || invoice.total || 0); }, 0);
    var outstandingTotal = outstanding.reduce(function (sum, invoice) { return sum + Number(invoice.balanceDue || 0); }, 0);
    var topInvoice = outstanding[0];
    var filtered = state.filter === 'all' ? invoices : state.filter === 'outstanding' ? outstanding : paid;
    body.innerHTML =
      (topInvoice ? renderOutstandingHero(topInvoice) : '<section class="invoice-settled-hero"><span>✓</span><div><strong>No outstanding invoices</strong><p>Your current CGM invoice record is up to date.</p></div></section>') +
      '<section class="invoice-summary-grid"><div><span>Invoices</span><strong>' + invoices.length + '</strong></div><div><span>Outstanding</span><strong>' + money(outstandingTotal) + '</strong></div><div><span>Recorded paid</span><strong>' + money(paidTotal) + '</strong></div></section>' +
      renderSpendAnalytics(state.list.spendByCategory || []) +
      '<section class="passport-section"><header><div><span class="eyebrow">Invoice record</span><h2>Your invoices</h2><p>Select an invoice for its itemised breakdown, secure PDF (when attached) and payment status.</p></div></header><div class="invoice-filter-tabs"><button type="button" class="' + (state.filter === 'all' ? 'is-active' : '') + '" data-invoice-filter="all">All <span>' + invoices.length + '</span></button><button type="button" class="' + (state.filter === 'outstanding' ? 'is-active' : '') + '" data-invoice-filter="outstanding">Outstanding <span>' + outstanding.length + '</span></button><button type="button" class="' + (state.filter === 'paid' ? 'is-active' : '') + '" data-invoice-filter="paid">Paid <span>' + paid.length + '</span></button></div><div class="invoice-passport-list">' + filtered.map(renderInvoiceCard).join('') + '</div></section>';
    document.querySelectorAll('[data-invoice-filter]').forEach(function (button) { button.addEventListener('click', function () { state.filter = button.dataset.invoiceFilter; renderList(); }); });
    document.querySelectorAll('[data-open-invoice]').forEach(function (button) { button.addEventListener('click', function () { openInvoice(Number(button.dataset.openInvoice)); }); });
  }

  function renderOutstandingHero(invoice) {
    var overdue = invoice.status === 'overdue';
    return '<section class="invoice-outstanding-hero ' + (overdue ? 'is-overdue' : '') + '"><div><span class="eyebrow">' + (overdue ? 'Action needed' : 'Payment due') + '</span><h2>' + money(invoice.balanceDue) + ' outstanding</h2><p>' + escapeHtml(invoice.invoiceNumber) + ' · Due ' + escapeHtml(date(invoice.dueDate)) + (overdue ? ' · This invoice is overdue' : '') + '</p></div><button type="button" class="btn-portal btn-gold" data-open-invoice="' + invoice.id + '">View payment details</button></section>';
  }

  function renderSpendAnalytics(rows) {
    var total = rows.reduce(function (sum, row) { return sum + Number(row.total || 0); }, 0);
    if (!rows.length) return '';
    return '<section class="passport-section spend-analytics"><header><div><span class="eyebrow">Spend picture</span><h2>Work categories on your record</h2><p>Based on the item categories recorded on issued invoices. This is a summary, not a payment statement.</p></div></header><div class="spend-bars">' + rows.map(function (row) { var percent = total ? Math.round((Number(row.total) / total) * 100) : 0; return '<div><header><span>' + escapeHtml(categoryLabel(row.category)) + '</span><strong>' + money(row.total) + '</strong></header><span class="spend-track"><i style="width:' + percent + '%"></i></span><small>' + percent + '% of issued work</small></div>'; }).join('') + '</div></section>';
  }

  function renderInvoiceCard(invoice) {
    var intent = invoice.paymentIntent;
    var intentLabel = intent && intent.status === 'requested' ? (intent.intentType === 'bank_transfer_notified' ? 'Transfer notification sent' : 'Payment-plan request sent') : '';
    return '<button type="button" class="invoice-passport-card" data-open-invoice="' + invoice.id + '"><div><span class="invoice-card-number">' + escapeHtml(invoice.invoiceNumber) + '</span><strong>' + escapeHtml(invoice.reference || 'CGM garden work') + '</strong><small>Issued ' + escapeHtml(date(invoice.issueDate)) + ' · Due ' + escapeHtml(date(invoice.dueDate)) + '</small>' + (intentLabel ? '<em>' + escapeHtml(intentLabel) + '</em>' : '') + '</div><div><strong>' + money(invoice.total) + '</strong>' + badge(invoice.status) + (isOutstanding(invoice) ? '<small>' + money(invoice.balanceDue) + ' due</small>' : '') + '</div><span aria-hidden="true">→</span></button>';
  }

  async function openInvoice(id) {
    try {
      var detail = await getInvoices(id);
      renderDetail(detail);
    } catch (error) { showError(error.message || 'Unable to open invoice.'); }
  }

  function renderDetail(detail) {
    var invoice = detail.invoice; var items = detail.items || []; var payments = detail.payments || []; var intents = detail.paymentIntents || [];
    var balance = Number(invoice.balanceDue || 0); var outstanding = isOutstanding(invoice) && balance > 0;
    var body = $('invoicePageBody');
    var rows = items.map(function (item) { return '<tr><td><strong>' + escapeHtml(item.description) + '</strong><small class="invoice-line-category">' + escapeHtml(categoryLabel(item.category || 'maintenance')) + '</small></td><td class="amount">' + item.quantity + '</td><td class="amount">' + money(item.unit_price) + '</td><td class="amount">' + money(item.line_total) + '</td></tr>'; }).join('');
    var pdf = invoice.hasPdf ? '<a class="btn-portal btn-ghost" href="/api/client-invoice-pdf?id=' + invoice.id + (state.context.isAdmin ? '&clientId=' + encodeURIComponent(state.context.clientId) : '') + '">Download PDF</a>' : '';
    body.innerHTML = '<section class="passport-section invoice-detail-passport"><button id="backToInvoices" class="text-button" type="button">← All invoices</button><header><div><span class="eyebrow">Invoice</span><h2>' + escapeHtml(invoice.invoiceNumber) + '</h2><p>' + escapeHtml(invoice.reference || 'CGM garden work') + ' · Issued ' + escapeHtml(date(invoice.issueDate)) + ' · Payment due ' + escapeHtml(date(invoice.dueDate)) + '</p></div>' + badge(invoice.status) + '</header>' +
      (invoice.notes ? '<div class="invoice-note"><strong>Note from CGM</strong><p>' + escapeHtml(invoice.notes) + '</p></div>' : '') +
      '<div class="invoice-table-wrap"><table class="invoice-table invoice-detail-table"><thead><tr><th>Description</th><th class="amount">Qty</th><th class="amount">Unit price</th><th class="amount">Total</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><th colspan="3">Subtotal</th><th class="amount">' + money(invoice.subtotal) + '</th></tr>' + (Number(invoice.vatAmount) ? '<tr><th colspan="3">VAT (' + (Number(invoice.vatRate) * 100).toFixed(0) + '%)</th><th class="amount">' + money(invoice.vatAmount) + '</th></tr>' : '') + '<tr class="invoice-grand-total"><th colspan="3">Total</th><th class="amount">' + money(invoice.total) + '</th></tr><tr><th colspan="3">Paid</th><th class="amount">' + money(invoice.amountPaid) + '</th></tr><tr class="invoice-balance"><th colspan="3">Balance due</th><th class="amount">' + money(balance) + '</th></tr></tfoot></table></div><div class="invoice-detail-actions">' + pdf + '</div>' +
      (payments.length ? renderPayments(payments) : '') +
      (intents.length ? renderPaymentIntents(intents) : '') +
      (outstanding ? renderPaymentPanel(invoice, detail.bankDetails, balance) : '<div class="invoice-settled-panel"><span>✓</span><div><strong>' + (invoice.status === 'paid' ? 'Invoice paid' : 'No payment action needed') + '</strong><p>' + (invoice.status === 'paid' ? 'CGM has recorded payment for this invoice.' : 'This invoice is not currently payable through the portal.') + '</p></div></div>') +
      '</section>';
    $('backToInvoices').addEventListener('click', function () { renderList(); });
    body.querySelectorAll('[data-copy-value]').forEach(function (button) { button.addEventListener('click', copyValue); });
    if ($('notifyTransferBtn')) $('notifyTransferBtn').addEventListener('click', function () { openTransferNotice(invoice, balance); });
    if ($('requestPlanBtn')) $('requestPlanBtn').addEventListener('click', function () { openPaymentPlanRequest(invoice, balance); });
  }

  function renderPayments(payments) {
    return '<section class="invoice-payment-history"><h3>Payments recorded by CGM</h3>' + payments.map(function (payment) { return '<div><span>' + escapeHtml(date(payment.paid_date)) + ' · ' + escapeHtml(String(payment.payment_method).replace(/_/g, ' ')) + '</span><strong>' + money(payment.amount) + '</strong></div>'; }).join('') + '</section>';
  }

  function renderPaymentIntents(intents) {
    return '<section class="invoice-intents"><h3>Your payment updates</h3>' + intents.map(function (intent) { return '<article class="intent-' + escapeHtml(intent.status) + '"><strong>' + escapeHtml(intent.intentType === 'bank_transfer_notified' ? 'Bank transfer notification' : 'Payment-plan request') + '</strong><span>' + escapeHtml(intent.status === 'requested' ? 'Waiting for CGM review' : intent.status) + '</span><p>' + escapeHtml(intent.note || '') + '</p><small>' + (intent.amount ? money(intent.amount) : '') + (intent.proposedDate ? ' · Proposed ' + escapeHtml(date(intent.proposedDate)) : '') + '</small></article>'; }).join('') + '</section>';
  }

  function renderPaymentPanel(invoice, bank, balance) {
    if (!bank) return '<section class="invoice-payment-panel"><h3>Payment details are being prepared</h3><p>Please contact CGM if you need to arrange payment before bank details appear here.</p></section>';
    var row = function (label, value, id) { return '<div class="invoice-pay-row"><span>' + label + '</span><strong id="' + id + '">' + escapeHtml(value) + '</strong><button type="button" class="btn-portal btn-ghost btn-compact" data-copy-value="' + id + '">Copy</button></div>'; };
    var actions = state.context.isAdmin
      ? '<p class="section-intro">Staff view: use the secure invoice register to record a received payment. This page does not create a payment.</p>'
      : '<div class="invoice-payment-actions"><button id="notifyTransferBtn" type="button" class="btn-portal btn-gold">I’ve made this transfer</button><button id="requestPlanBtn" type="button" class="btn-portal btn-ghost">Ask about a payment plan</button></div><p class="payment-safety-copy">Selecting this does not move money or mark the invoice paid. CGM will confirm only after the transfer is received.</p>';
    return '<section class="invoice-payment-panel"><div><span class="eyebrow">Bank transfer</span><h3>Pay ' + money(balance) + ' by bank transfer</h3><p>Use <strong>' + escapeHtml(invoice.invoiceNumber) + '</strong> as the payment reference so CGM can match the transfer.</p></div>' + row('Account name', bank.account_name, 'bank-account-name') + row('Sort code', bank.sort_code, 'bank-sort-code') + row('Account number', bank.account_number, 'bank-account-number') + row('Payment reference', invoice.invoiceNumber, 'bank-payment-reference') + '<div class="invoice-pay-row total"><span>Amount due</span><strong>' + money(balance) + '</strong></div>' + actions + '</section>';
  }

  function openTransferNotice(invoice, balance) {
    openModal('Confirm transfer notification', '<p class="section-intro">Only continue after you have made a bank transfer using the payment details above. This creates a notification for CGM; it does not mark your invoice as paid.</p><div class="invoice-payment-summary">Invoice <strong>' + escapeHtml(invoice.invoiceNumber) + '</strong><br>Amount notified <strong>' + money(balance) + '</strong></div><div class="field"><label for="transferNote">Optional note for CGM</label><textarea id="transferNote" maxlength="2000" rows="3" placeholder="For example: Sent from our joint account"></textarea></div>', '<button type="button" class="btn-portal btn-ghost" data-close-modal>Cancel</button><button type="button" class="btn-portal btn-gold" id="sendTransferNotice">Notify CGM</button>', function (modal) {
      modal.querySelector('#sendTransferNotice').addEventListener('click', async function () {
        var button = modal.querySelector('#sendTransferNotice'); button.disabled = true; button.textContent = 'Sending…';
        try {
          var result = await invoiceAction({ invoiceId: invoice.id, intentType: 'bank_transfer_notified', amount: balance, note: modal.querySelector('#transferNote').value });
          if (!result.ok) throw new Error(result.error || 'Unable to notify CGM.');
          modal.remove(); showSuccess(result.message); await reopen(invoice.id);
        } catch (error) { modalAlert(modal, error.message || 'Unable to notify CGM.'); button.disabled = false; button.textContent = 'Notify CGM'; }
      });
    });
  }

  function openPaymentPlanRequest(invoice, balance) {
    openModal('Ask CGM about a payment plan', '<p class="section-intro">This sends a request to discuss options. It does not change the invoice or create a payment arrangement automatically.</p><div class="invoice-form-grid"><div class="field"><label for="planAmount">Proposed amount</label><input id="planAmount" type="number" min="0.01" max="' + balance + '" step="0.01" value="' + balance + '"></div><div class="field"><label for="planDate">Proposed first date</label><input id="planDate" type="date" value="' + new Date().toISOString().slice(0, 10) + '"></div></div><div class="field"><label for="planNote">Message for CGM</label><textarea id="planNote" maxlength="2000" rows="4" placeholder="Tell us what arrangement you would like to discuss."></textarea></div>', '<button type="button" class="btn-portal btn-ghost" data-close-modal>Cancel</button><button type="button" class="btn-portal btn-primary" id="sendPlanRequest">Send request</button>', function (modal) {
      modal.querySelector('#sendPlanRequest').addEventListener('click', async function () {
        var button = modal.querySelector('#sendPlanRequest'); button.disabled = true; button.textContent = 'Sending…';
        try {
          var result = await invoiceAction({ invoiceId: invoice.id, intentType: 'payment_plan_request', amount: modal.querySelector('#planAmount').value, proposedDate: modal.querySelector('#planDate').value, note: modal.querySelector('#planNote').value });
          if (!result.ok) throw new Error(result.error || 'Unable to send payment-plan request.');
          modal.remove(); showSuccess(result.message); await reopen(invoice.id);
        } catch (error) { modalAlert(modal, error.message || 'Unable to send payment-plan request.'); button.disabled = false; button.textContent = 'Send request'; }
      });
    });
  }

  async function invoiceAction(payload) {
    var response = await fetch('/api/client-invoice-action', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    var result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.error || 'Unable to save invoice action.');
    return result;
  }

  async function reopen(id) { state.list = await getInvoices(); await openInvoice(id); }

  async function copyValue(event) {
    var button = event.currentTarget; var value = $(button.dataset.copyValue).textContent;
    try { await navigator.clipboard.writeText(value); var original = button.textContent; button.textContent = 'Copied'; setTimeout(function () { button.textContent = original; }, 1400); } catch (_) { showError('Unable to copy automatically. Please select the detail and copy it manually.'); }
  }

  function badge(status) { return '<span class="invoice-status invoice-status-' + escapeHtml(status) + '">' + escapeHtml({ sent: 'Sent', partial: 'Part paid', paid: 'Paid', overdue: 'Overdue' }[status] || status) + '</span>'; }
  function isOutstanding(invoice) { return ['sent', 'partial', 'overdue'].includes(invoice.status) && Number(invoice.balanceDue || 0) > 0; }
  function categoryLabel(category) { return { maintenance: 'Maintenance', materials: 'Materials', planting: 'Planting', project: 'Project work', other: 'Other' }[category] || 'Maintenance'; }
  function showError(message) { var alert = $('invoicePageAlert'); alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = message; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function showSuccess(message) { var alert = $('invoicePageAlert'); alert.hidden = false; alert.className = 'alert alert-success'; alert.textContent = message; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function openModal(title, body, footer, onReady) {
    var modal = document.createElement('div'); modal.className = 'modal-backdrop passport-modal-backdrop';
    modal.innerHTML = '<div class="modal passport-modal" role="dialog" aria-modal="true" aria-labelledby="passportInvoiceModalTitle"><div class="modal-head"><h3 id="passportInvoiceModalTitle">' + escapeHtml(title) + '</h3><button type="button" class="modal-close" data-close-modal aria-label="Close">×</button></div><div class="modal-body"><div class="alert alert-error" data-modal-alert hidden></div>' + body + '</div><div class="modal-foot">' + footer + '</div></div>';
    document.body.appendChild(modal); modal.querySelectorAll('[data-close-modal]').forEach(function (button) { button.addEventListener('click', function () { modal.remove(); }); }); modal.addEventListener('click', function (event) { if (event.target === modal) modal.remove(); }); if (onReady) onReady(modal);
  }
  function modalAlert(modal, message) { var alert = modal.querySelector('[data-modal-alert]'); alert.hidden = false; alert.textContent = message; }
}());
