/* Print-ready CGM invoice generated from a secured admin invoice record. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var money = function (value) { return '£' + Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var text = function (value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var formatDate = function (value) { return value ? new Date(value + (String(value).length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    $('printInvoiceBtn').addEventListener('click', function () { window.print(); });
    var id = new URLSearchParams(window.location.search).get('id');
    if (!/^[1-9]\d*$/.test(id || '')) return showError('Choose an invoice from the invoice register first.');
    try {
      var session = await getJson('/api/auth-session');
      if (!session.authenticated || !session.isAdmin) return showNotAuthorised();
      var data = await getJson('/api/admin-invoices?id=' + encodeURIComponent(id));
      render(data.invoice, data.items || [], data.payments || [], data.bankDetails || null);
    } catch (error) {
      showError(error.message || 'Unable to prepare this invoice.');
    }
  }

  async function getJson(url) {
    var response = await fetch(url, { credentials: 'include' });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  function showNotAuthorised() { $('loadingState').hidden = true; $('notAuthState').hidden = false; }
  function showError(message) {
    $('loadingState').hidden = true;
    $('invoiceDocument').hidden = false;
    $('invoiceDocument').innerHTML = '<section class="portal-empty-screen"><h1>Invoice unavailable</h1><p>' + text(message) + '</p><a class="btn-portal btn-primary" href="/portal/admin/invoices/">Back to invoices</a></section>';
  }

  function status(invoice) {
    var names = { sent: 'Unpaid', partial: 'Part paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled', draft: 'Draft' };
    return names[invoice.status] || invoice.status;
  }

  function render(invoice, items, payments, bank) {
    document.title = invoice.invoiceNumber + ' | Chiltern Garden Maintenance';
    var address = [invoice.clientAddress, invoice.clientServiceArea].filter(Boolean).map(text).join('<br>') || 'Address held in the client record';
    var rows = items.map(function (item) {
      return '<tr><td>' + text(item.description) + '</td><td class="numeric">' + text(item.quantity) + '</td><td class="numeric">' + money(item.unit_price) + '</td><td class="numeric">' + money(item.line_total) + '</td></tr>';
    }).join('');
    var vat = Number(invoice.vatAmount) ? '<tr><th colspan="3">VAT (' + (Number(invoice.vatRate) * 100).toFixed(0) + '%)</th><td>' + money(invoice.vatAmount) + '</td></tr>' : '<tr><th colspan="3">VAT</th><td>Not charged</td></tr>';
    var paymentsTotal = payments.reduce(function (sum, payment) { return sum + Number(payment.amount || 0); }, 0);
    var paymentDetails = bank
      ? '<div class="invoice-payment-details"><h2>Payment details</h2><p><strong>Account name</strong><span>' + text(bank.account_name) + '</span></p><p><strong>Sort code</strong><span>' + text(bank.sort_code) + '</span></p><p><strong>Account number</strong><span>' + text(bank.account_number) + '</span></p><p><strong>Payment reference</strong><span>' + text(invoice.invoiceNumber) + '</span></p></div>'
      : '<div class="invoice-payment-details"><h2>Payment details</h2><p>Bank-transfer details will be confirmed separately.</p></div>';
    var notes = invoice.notes ? '<section class="invoice-document-notes"><h2>Notes / agreed variations</h2><p>' + text(invoice.notes).replace(/\n/g, '<br>') + '</p></section>' : '';

    $('loadingState').hidden = true;
    $('invoiceDocument').hidden = false;
    $('invoiceDocument').innerHTML =
      '<article class="invoice-document">' +
        '<header class="invoice-document-header"><div class="invoice-brand"><img src="/images/cgm-logo-square.png" alt="CGM"><div><strong>Chiltern Garden</strong><span>Maintenance</span><small>Garden &amp; Grounds Maintenance</small></div></div><div class="invoice-heading"><span class="invoice-status-print status-' + text(invoice.status) + '">' + text(status(invoice)) + '</span><h1>Invoice</h1><p>Itemised record of services, materials and payment due.</p></div></header>' +
        '<section class="invoice-document-meta"><div><span>Invoice number</span><strong>' + text(invoice.invoiceNumber) + '</strong></div><div><span>Invoice date</span><strong>' + formatDate(invoice.issueDate) + '</strong></div><div><span>Payment due</span><strong>' + formatDate(invoice.dueDate) + '</strong></div><div><span>Payment terms</span><strong>' + text(invoice.paymentTerms || 'On receipt') + '</strong></div><div><span>Issued by</span><strong>Chiltern Garden Maintenance</strong><p>43 Lower Road, Chinnor, Oxfordshire, OX39 4DU</p></div><div><span>Job / quote reference</span><strong>' + text(invoice.reference || '—') + '</strong><p>VAT status: ' + (Number(invoice.vatAmount) ? 'VAT charged as shown below.' : 'Not VAT registered — no VAT charged.') + '</p></div></section>' +
        '<section class="invoice-document-addresses"><div><h2>Bill to</h2><strong>' + text(invoice.clientName) + '</strong><p>' + address + '</p><p>' + text(invoice.clientEmail || '') + '</p></div><div><h2>Service address / site</h2><strong>' + text(invoice.clientName) + '</strong><p>' + address + '</p></div></section>' +
        '<section class="invoice-document-lines"><h2>Itemised charges</h2><table><thead><tr><th>Description of service / material</th><th class="numeric">Qty</th><th class="numeric">Rate</th><th class="numeric">Line total</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><th colspan="3">Subtotal</th><td>' + money(invoice.subtotal) + '</td></tr>' + vat + '<tr><th colspan="3">Payments received</th><td>' + money(paymentsTotal) + '</td></tr><tr class="invoice-document-total"><th colspan="3">Total due</th><td>' + money(invoice.total) + '</td></tr><tr class="invoice-document-balance"><th colspan="3">Balance due</th><td>' + money(invoice.balanceDue) + '</td></tr></tfoot></table></section>' +
        paymentDetails + notes +
        '<footer class="invoice-document-footer"><p>Please retain this invoice for your records. Queries should be raised before the payment due date.</p><p>Chiltern Garden Maintenance · Oxfordshire, Buckinghamshire &amp; Berkshire · 07467 657459</p></footer>' +
      '</article>';
  }
}());
