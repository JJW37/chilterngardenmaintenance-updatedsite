/* CGM staff invoice management. */
(function () {
  'use strict';
  var state = { clients: [], invoices: [], bankDetails: null };
  var $ = function (id) { return document.getElementById(id); };
  var money = function (value) { return '£' + Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var date = function (value) { return value ? new Date(value + (String(value).length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; };
  var escapeHtml = function (value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    $('year').textContent = new Date().getFullYear();
    bindShell();
    try {
      var session = await getJson('/api/auth-session');
      if (!session.authenticated || !session.isAdmin) return showNotAuthorised();
      state.clients = (await getJson('/api/admin-clients')).clients || [];
      populateClientControls();
      await loadInvoices();
      $('loadingState').hidden = true; $('invoiceApp').hidden = false;
    } catch (error) { showNotAuthorised(); }
  }

  function bindShell() {
    $('logoutBtn').addEventListener('click', async function () { try { await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' }); } finally { window.location.assign('/portal/admin/'); } });
    $('newInvoiceBtn').addEventListener('click', openCreateInvoice);
    $('bankDetailsBtn').addEventListener('click', openBankDetails);
    $('clientFilter').addEventListener('change', loadInvoices);
    $('statusFilter').addEventListener('change', loadInvoices);
    $('clearInvoiceFilters').addEventListener('click', function () { $('clientFilter').value = ''; $('statusFilter').value = ''; loadInvoices(); });
    $('invoiceModal').addEventListener('click', function (event) { if (event.target === this) closeModal(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeModal(); });
  }

  function showNotAuthorised() { $('loadingState').hidden = true; $('notAuthState').hidden = false; }
  function showAlert(message, type) { var alert = $('pageAlert'); alert.hidden = false; alert.className = 'alert alert-' + (type || 'info'); alert.textContent = message; }
  function closeModal() { $('invoiceModal').hidden = true; $('invoiceModalBody').innerHTML = ''; $('invoiceModalFoot').innerHTML = ''; }
  async function getJson(url, options) { var response = await fetch(url, Object.assign({ credentials: 'include' }, options || {})); var data = await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed.'); return data; }

  function populateClientControls() {
    state.clients.forEach(function (client) {
      var label = client.householdName + (client.isActive ? '' : ' (inactive)');
      $('clientFilter').appendChild(new Option(label, client.id));
    });
  }

  async function loadInvoices() {
    var query = new URLSearchParams();
    if ($('clientFilter').value) query.set('clientId', $('clientFilter').value);
    if ($('statusFilter').value) query.set('status', $('statusFilter').value);
    try {
      var data = await getJson('/api/admin-invoices' + (query.toString() ? '?' + query.toString() : ''));
      state.invoices = data.invoices || [];
      state.bankDetails = data.bankDetails || null;
      renderInvoiceList();
    } catch (error) { showAlert(error.message || 'Unable to load invoices.', 'error'); }
  }

  function badge(status) { return '<span class="invoice-status invoice-status-' + escapeHtml(status) + '">' + escapeHtml({ sent: 'Sent', partial: 'Part paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled', draft: 'Draft' }[status] || status) + '</span>'; }
  function renderInvoiceList() {
    var invoices = state.invoices;
    $('invoiceSummary').textContent = invoices.length ? invoices.length + ' invoice' + (invoices.length === 1 ? '' : 's') + ' shown' : 'No invoices match these filters.';
    var list = $('invoiceList');
    if (!invoices.length) { list.innerHTML = '<div class="empty-state"><div class="es-icon">£</div><h3>No invoices yet</h3><p>Create the first client invoice when you are ready.</p></div>'; return; }
    list.innerHTML = '<div class="invoice-table-wrap"><table class="invoice-table"><thead><tr><th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th class="amount">Total</th><th class="amount">Balance</th><th>Status</th><th></th></tr></thead><tbody>' + invoices.map(function (invoice) {
      return '<tr><td><button class="invoice-link" type="button" data-open-invoice="' + invoice.id + '">' + escapeHtml(invoice.invoiceNumber) + '</button></td><td>' + escapeHtml(invoice.clientName) + '</td><td>' + date(invoice.issueDate) + '</td><td>' + date(invoice.dueDate) + '</td><td class="amount">' + money(invoice.total) + '</td><td class="amount">' + money(invoice.balanceDue) + '</td><td>' + badge(invoice.status) + '</td><td><button class="btn-portal btn-ghost btn-compact" type="button" data-open-invoice="' + invoice.id + '">View</button></td></tr>';
    }).join('') + '</tbody></table></div>';
    list.querySelectorAll('[data-open-invoice]').forEach(function (button) { button.addEventListener('click', function () { openInvoice(Number(button.dataset.openInvoice)); }); });
  }

  function modal(title, body, foot) {
    $('invoiceModalTitle').textContent = title; $('invoiceModalBody').innerHTML = body; $('invoiceModalFoot').innerHTML = foot || '<button class="btn-portal btn-ghost" type="button" data-close-modal>Close</button>'; $('invoiceModal').hidden = false;
    $('invoiceModal').querySelectorAll('[data-close-modal]').forEach(function (button) { button.addEventListener('click', closeModal); });
  }

  function openCreateInvoice() {
    if (!state.clients.filter(function (client) { return client.isActive; }).length) { showAlert('Create an active client before creating an invoice.', 'error'); return; }
    var clientOptions = state.clients.filter(function (client) { return client.isActive; }).map(function (client) { return '<option value="' + client.id + '">' + escapeHtml(client.householdName) + '</option>'; }).join('');
    var today = new Date().toISOString().slice(0, 10);
    modal('Create invoice', '<div id="invoiceFormAlert" class="alert" hidden></div><form id="createInvoiceForm"><div class="invoice-form-grid"><div class="field"><label for="invoiceClient">Client</label><select id="invoiceClient" required>' + clientOptions + '</select></div><div class="field"><label for="invoiceDueDate">Payment due</label><input id="invoiceDueDate" type="date" value="' + today + '" required></div><div class="field"><label for="invoiceTerms">Terms</label><input id="invoiceTerms" value="On receipt" maxlength="120"></div><div class="field"><label for="invoiceReference">Job / quote reference</label><input id="invoiceReference" maxlength="160" placeholder="Optional"></div></div><div class="field"><label>Line items</label><div id="invoiceLineItems"></div><button id="addInvoiceLine" class="btn-portal btn-ghost btn-compact" type="button">+ Add line</button></div><div class="invoice-form-grid"><div class="field"><label for="invoiceVatRate">VAT rate (%)</label><input id="invoiceVatRate" type="number" min="0" max="100" step="0.5" value="0"><small>CGM is currently not VAT registered, so leave this at 0.</small></div><div class="field"><label for="invoiceNotes">Notes for client</label><textarea id="invoiceNotes" maxlength="8000" rows="3" placeholder="Optional"></textarea></div></div><div class="invoice-total-preview"><span>Invoice total</span><strong id="invoiceTotalPreview">£0.00</strong></div></form>', '<button class="btn-portal btn-ghost" type="button" data-close-modal>Cancel</button><button id="saveInvoiceBtn" class="btn-portal btn-primary" type="button">Create &amp; issue invoice</button>');
    addLineItem();
    $('addInvoiceLine').addEventListener('click', addLineItem);
    $('invoiceLineItems').addEventListener('input', updateInvoiceTotal);
    $('invoiceVatRate').addEventListener('input', updateInvoiceTotal);
    $('saveInvoiceBtn').addEventListener('click', createInvoice);
  }

  function addLineItem(values) {
    var item = values || { description: '', quantity: 1, unitPrice: '' };
    var row = document.createElement('div'); row.className = 'invoice-line-item';
    row.innerHTML = '<input class="invoice-line-description" maxlength="500" placeholder="Description" value="' + escapeHtml(item.description) + '"><input class="invoice-line-quantity" type="number" min="0.01" step="0.01" aria-label="Quantity" value="' + escapeHtml(item.quantity) + '"><input class="invoice-line-price" type="number" min="0" step="0.01" aria-label="Unit price in pounds" placeholder="Unit price" value="' + escapeHtml(item.unitPrice) + '"><button class="invoice-remove-line" type="button" aria-label="Remove line">×</button>';
    row.querySelector('.invoice-remove-line').addEventListener('click', function () { if (document.querySelectorAll('.invoice-line-item').length > 1) { row.remove(); updateInvoiceTotal(); } });
    $('invoiceLineItems').appendChild(row); updateInvoiceTotal();
  }

  function updateInvoiceTotal() {
    var subtotal = Array.prototype.reduce.call(document.querySelectorAll('.invoice-line-item'), function (sum, row) { return sum + (Number(row.querySelector('.invoice-line-quantity').value) || 0) * (Number(row.querySelector('.invoice-line-price').value) || 0); }, 0);
    var vat = Number($('invoiceVatRate').value) || 0; $('invoiceTotalPreview').textContent = money(subtotal * (1 + vat / 100));
  }

  async function createInvoice() {
    var lineItems = Array.prototype.map.call(document.querySelectorAll('.invoice-line-item'), function (row) { return { description: row.querySelector('.invoice-line-description').value, quantity: row.querySelector('.invoice-line-quantity').value, unitPrice: row.querySelector('.invoice-line-price').value }; });
    var alert = $('invoiceFormAlert'); var button = $('saveInvoiceBtn'); button.disabled = true; button.textContent = 'Creating…';
    try {
      var data = await getJson('/api/admin-invoice-create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: $('invoiceClient').value, dueDate: $('invoiceDueDate').value, paymentTerms: $('invoiceTerms').value, reference: $('invoiceReference').value, lineItems: lineItems, vatRate: (Number($('invoiceVatRate').value) || 0) / 100, notes: $('invoiceNotes').value }) });
      closeModal(); await loadInvoices(); showAlert(data.invoice.number + ' has been issued to ' + data.invoice.clientName + '.', 'success'); openInvoice(data.invoice.id);
    } catch (error) { alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = error.message || 'Unable to create invoice.'; button.disabled = false; button.textContent = 'Create & issue invoice'; }
  }

  async function openInvoice(id) {
    try {
      var data = await getJson('/api/admin-invoices?id=' + encodeURIComponent(id));
      var invoice = data.invoice; var items = data.items || []; var payments = data.payments || [];
      var itemRows = items.map(function (item) { return '<tr><td>' + escapeHtml(item.description) + '</td><td class="amount">' + item.quantity + '</td><td class="amount">' + money(item.unit_price) + '</td><td class="amount">' + money(item.line_total) + '</td></tr>'; }).join('');
      var paymentRows = payments.length ? '<div class="invoice-payments"><h4>Payments received</h4>' + payments.map(function (payment) { return '<div><span>' + date(payment.paid_date) + ' · ' + escapeHtml(payment.payment_method.replace(/_/g, ' ')) + (payment.payment_ref ? ' · ' + escapeHtml(payment.payment_ref) : '') + '</span><strong>' + money(payment.amount) + '</strong></div>'; }).join('') + '</div>' : '';
      var printButton = '<button class="btn-portal btn-gold" type="button" id="produceInvoiceBtn">Print / save PDF</button>';
      var pdfButton = invoice.hasPdf ? '<a class="btn-portal btn-ghost" href="/api/client-invoice-pdf?id=' + invoice.id + '&clientId=' + invoice.clientId + '">Download attached PDF</a>' : '<button class="btn-portal btn-ghost" type="button" id="attachPdfBtn">Attach existing PDF</button>';
      var actions = invoice.status !== 'paid' && invoice.status !== 'cancelled' ? '<button class="btn-portal btn-primary" type="button" id="recordPaymentBtn">Record payment</button><button class="btn-portal btn-danger" type="button" id="cancelInvoiceBtn">Cancel invoice</button>' : '';
      modal(invoice.invoiceNumber, '<div class="invoice-detail-head"><div><p>' + escapeHtml(invoice.clientName) + '</p><p class="invoice-detail-meta">Issued ' + date(invoice.issueDate) + ' · Due ' + date(invoice.dueDate) + (invoice.reference ? ' · ' + escapeHtml(invoice.reference) : '') + '</p></div>' + badge(invoice.status) + '</div>' + (invoice.notes ? '<div class="invoice-note"><strong>Note</strong><p>' + escapeHtml(invoice.notes) + '</p></div>' : '') + '<div class="invoice-table-wrap"><table class="invoice-table"><thead><tr><th>Description</th><th class="amount">Qty</th><th class="amount">Unit price</th><th class="amount">Total</th></tr></thead><tbody>' + itemRows + '</tbody><tfoot><tr><th colspan="3">Subtotal</th><th class="amount">' + money(invoice.subtotal) + '</th></tr>' + (Number(invoice.vatAmount) ? '<tr><th colspan="3">VAT (' + (Number(invoice.vatRate) * 100).toFixed(0) + '%)</th><th class="amount">' + money(invoice.vatAmount) + '</th></tr>' : '') + '<tr class="invoice-grand-total"><th colspan="3">Total</th><th class="amount">' + money(invoice.total) + '</th></tr><tr><th colspan="3">Paid</th><th class="amount">' + money(invoice.amountPaid) + '</th></tr><tr class="invoice-balance"><th colspan="3">Balance due</th><th class="amount">' + money(invoice.balanceDue) + '</th></tr></tfoot></table></div>' + paymentRows, '<button class="btn-portal btn-ghost" type="button" data-close-modal>Close</button>' + printButton + pdfButton + actions);
      $('produceInvoiceBtn').addEventListener('click', function () { openPrintableInvoice(invoice); });
      if ($('attachPdfBtn')) $('attachPdfBtn').addEventListener('click', function () { openPdfUpload(invoice); });
      if ($('recordPaymentBtn')) $('recordPaymentBtn').addEventListener('click', function () { openPayment(invoice); });
      if ($('cancelInvoiceBtn')) $('cancelInvoiceBtn').addEventListener('click', function () { cancelInvoice(invoice); });
    } catch (error) { showAlert(error.message || 'Unable to open invoice.', 'error'); }
  }

  function openPrintableInvoice(invoice) {
    window.open('/portal/admin/invoices/print/?id=' + encodeURIComponent(invoice.id), '_blank', 'noopener');
  }

  function openPdfUpload(invoice) {
    modal('Attach PDF · ' + invoice.invoiceNumber, '<div id="pdfAlert" class="alert" hidden></div><div class="field"><label for="invoicePdf">Invoice PDF</label><input id="invoicePdf" type="file" accept="application/pdf,.pdf"><small>PDF only, maximum 10MB. The client can then download it securely.</small></div>', '<button class="btn-portal btn-ghost" type="button" data-close-modal>Cancel</button><button id="uploadPdfBtn" class="btn-portal btn-primary" type="button">Attach PDF</button>');
    $('uploadPdfBtn').addEventListener('click', async function () { var file = $('invoicePdf').files[0]; if (!file) return; var form = new FormData(); form.append('invoiceId', invoice.id); form.append('file', file); var button = $('uploadPdfBtn'); button.disabled = true; button.textContent = 'Uploading…'; try { await getJson('/api/admin-invoice-pdf', { method: 'POST', body: form }); await loadInvoices(); openInvoice(invoice.id); } catch (error) { $('pdfAlert').hidden = false; $('pdfAlert').className = 'alert alert-error'; $('pdfAlert').textContent = error.message; button.disabled = false; button.textContent = 'Attach PDF'; } });
  }

  function openPayment(invoice) {
    modal('Record payment · ' + invoice.invoiceNumber, '<div id="paymentAlert" class="alert" hidden></div><form id="paymentForm"><div class="invoice-payment-summary">Outstanding balance <strong>' + money(invoice.balanceDue) + '</strong></div><div class="invoice-form-grid"><div class="field"><label for="paymentAmount">Amount received</label><input id="paymentAmount" type="number" min="0.01" max="' + invoice.balanceDue + '" step="0.01" value="' + invoice.balanceDue + '"></div><div class="field"><label for="paymentDate">Payment date</label><input id="paymentDate" type="date" value="' + new Date().toISOString().slice(0, 10) + '"></div><div class="field"><label for="paymentMethod">Method</label><select id="paymentMethod"><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="card">Card</option><option value="other">Other</option></select></div><div class="field"><label for="paymentReference">Bank reference</label><input id="paymentReference" maxlength="160" value="' + escapeHtml(invoice.invoiceNumber) + '"></div></div><div class="field"><label for="paymentNotes">Internal note</label><textarea id="paymentNotes" maxlength="4000" rows="3"></textarea></div></form>', '<button class="btn-portal btn-ghost" type="button" data-close-modal>Cancel</button><button id="savePaymentBtn" class="btn-portal btn-primary" type="button">Confirm payment</button>');
    $('savePaymentBtn').addEventListener('click', async function () { var button = $('savePaymentBtn'); button.disabled = true; button.textContent = 'Saving…'; try { await getJson('/api/admin-invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'record-payment', invoiceId: invoice.id, amount: $('paymentAmount').value, paidDate: $('paymentDate').value, paymentMethod: $('paymentMethod').value, paymentReference: $('paymentReference').value, notes: $('paymentNotes').value }) }); await loadInvoices(); openInvoice(invoice.id); showAlert('Payment recorded.', 'success'); } catch (error) { $('paymentAlert').hidden = false; $('paymentAlert').className = 'alert alert-error'; $('paymentAlert').textContent = error.message; button.disabled = false; button.textContent = 'Confirm payment'; } });
  }

  async function cancelInvoice(invoice) { if (!window.confirm('Cancel ' + invoice.invoiceNumber + '? This cannot be undone.')) return; try { await getJson('/api/admin-invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', invoiceId: invoice.id }) }); closeModal(); await loadInvoices(); showAlert(invoice.invoiceNumber + ' has been cancelled.', 'success'); } catch (error) { showAlert(error.message, 'error'); } }

  function openBankDetails() {
    var bank = state.bankDetails || {};
    modal('Client payment details', '<div id="bankAlert" class="alert" hidden></div><p class="section-intro">These details appear only to signed-in clients with an outstanding invoice.</p><div class="invoice-form-grid"><div class="field"><label for="bankLabel">Label</label><input id="bankLabel" maxlength="80" value="' + escapeHtml(bank.label || 'Main account') + '"></div><div class="field"><label for="bankName">Bank name</label><input id="bankName" maxlength="120" placeholder="Optional" value="' + escapeHtml(bank.bank_name || '') + '"></div><div class="field"><label for="accountName">Account name</label><input id="accountName" maxlength="160" placeholder="e.g. Chiltern Garden Maintenance" value="' + escapeHtml(bank.account_name || '') + '"></div><div class="field"><label for="sortCode">Sort code</label><input id="sortCode" inputmode="numeric" placeholder="00-00-00" value="' + escapeHtml(bank.sort_code || '') + '"></div><div class="field"><label for="accountNumber">Account number</label><input id="accountNumber" inputmode="numeric" placeholder="12345678" value="' + escapeHtml(bank.account_number || '') + '"></div></div>', '<button class="btn-portal btn-ghost" type="button" data-close-modal>Cancel</button><button id="saveBankBtn" class="btn-portal btn-primary" type="button">Save payment details</button>');
    $('saveBankBtn').addEventListener('click', async function () { var button = $('saveBankBtn'); button.disabled = true; button.textContent = 'Saving…'; try { await getJson('/api/admin-invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save-bank-details', label: $('bankLabel').value, bankName: $('bankName').value, accountName: $('accountName').value, sortCode: $('sortCode').value, accountNumber: $('accountNumber').value }) }); closeModal(); showAlert('Client payment details saved.', 'success'); } catch (error) { $('bankAlert').hidden = false; $('bankAlert').className = 'alert alert-error'; $('bankAlert').textContent = error.message; button.disabled = false; button.textContent = 'Save payment details'; } });
  }
}());
