/* Focused client-portal pages: history, plan, photos, messages and account. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    var page = document.body.getAttribute('data-portal-page');
    try {
      var context = await window.CGMPortal.getContext();
      if (!context) { window.CGMPortal.showPageState('unauthorised'); return; }
      var data = await window.CGMPortal.getData(context);
      window.CGMPortal.setupNavigation(context, page);
      renderHeader(data, context, page);
      if (page === 'history') renderHistory(data);
      else if (page === 'plan') renderPlan(data);
      else if (page === 'photos') renderPhotos(data);
      else if (page === 'messages') renderMessages(data, context);
      else if (page === 'account') renderAccount(data, context);
      window.CGMPortal.showPageState('content');
    } catch (error) {
      console.error('[portal-subpage] unable to initialise', error);
      window.CGMPortal.showPageState('unauthorised');
    }
  }

  function renderHeader(data, context, page) {
    var labels = {
      history: ['Visit history', 'A chronological record of work completed and progress observed in your garden.'],
      plan: ['Garden plan', 'Your private seasonal priorities and the work CGM recommends next.'],
      photos: ['Garden photographs', 'A private, chronological visual record of your garden.'],
      messages: ['Messages & updates', 'A direct private conversation between your household and CGM.'],
      account: ['Account & security', 'Your household details and private portal password.'],
    };
    var label = labels[page] || ['', ''];
    document.title = label[0] + ' | ' + data.client.householdName + ' | CGM';
    document.getElementById('portalPageTitle').textContent = label[0];
    document.getElementById('portalPageIntro').textContent = label[1];
    document.getElementById('householdLabel').textContent = data.client.householdName;
    if (context.isAdmin) document.getElementById('adminBanner').hidden = false;
  }

  function renderHistory(data) {
    var notes = (data.notes || []).filter(function (note) { return note.noteType === 'visit'; });
    var years = new Set(notes.map(function (note) { return String(note.visitDate || note.createdAt).slice(0, 4); })).size;
    var body = document.getElementById('pageBody');
    body.innerHTML =
      '<div class="portal-stat-grid">' +
        stat(notes.length, 'Visits recorded') +
        stat(years || '—', years === 1 ? 'Year on record' : 'Years on record') +
        stat(data.images ? data.images.length : 0, 'Private photos') +
      '</div>' +
      '<section class="portal-section"><div class="section-heading-row"><div><h2>Completed visits</h2><p>Each note is added by CGM after a significant visit.</p></div></div>' +
      (notes.length ? '<div class="visit-timeline">' + notes.map(renderVisit).join('') + '</div>' : empty('No visit history yet', 'Your first recorded visit will appear here once the private portal is in use.')) +
      '</section>';
  }

  function renderVisit(note) {
    var title = window.CGMPortal.escapeHtml(note.title || 'Garden visit');
    var date = window.CGMPortal.formatDate(note.visitDate || note.createdAt);
    return '<article class="visit-entry">' +
      '<div class="visit-date"><span>' + date + '</span></div>' +
      '<div class="visit-card"><span class="note-tag visit">Visit record</span><h3>' + title + '</h3>' +
      '<p>' + nl2br(note.body) + '</p><small>Recorded ' + window.CGMPortal.formatRelative(note.createdAt) + '</small></div>' +
      '</article>';
  }

  function renderPlan(data) {
    var items = data.planItems || [];
    var active = items.filter(function (item) { return item.status !== 'complete'; });
    var body = document.getElementById('pageBody');
    body.innerHTML =
      '<div class="portal-stat-grid">' +
        stat(active.length, 'Active priorities') +
        stat(items.filter(function (item) { return item.status === 'in_progress'; }).length, 'In progress') +
        stat(items.filter(function (item) { return item.status === 'complete'; }).length, 'Completed') +
      '</div>' +
      '<section class="portal-section"><div class="section-heading-row"><div><h2>Seasonal priorities</h2><p>This is CGM’s shared direction for your garden. It is updated as your garden develops.</p></div></div>' +
      (items.length ? '<div class="plan-list">' + items.map(renderPlanItem).join('') + '</div>' : empty('Your garden plan is being prepared', 'After the first planning visit, seasonal priorities and recommendations will appear here.')) +
      '</section>';
  }

  function renderPlanItem(item) {
    var status = { planned: 'Planned', in_progress: 'In progress', complete: 'Completed' }[item.status] || 'Planned';
    var priority = { essential: 'Essential', recommended: 'Recommended', optional: 'Optional' }[item.priority] || 'Recommended';
    return '<article class="plan-item status-' + window.CGMPortal.escapeHtml(item.status) + '">' +
      '<div class="plan-item-top"><div><span class="plan-season">' + window.CGMPortal.escapeHtml(item.season) + '</span><h3>' + window.CGMPortal.escapeHtml(item.title) + '</h3></div>' +
      '<div class="plan-tags"><span class="plan-priority priority-' + window.CGMPortal.escapeHtml(item.priority) + '">' + priority + '</span><span class="plan-status">' + status + '</span></div></div>' +
      (item.detail ? '<p>' + nl2br(item.detail) + '</p>' : '') +
      (item.targetDate ? '<small>Target: ' + window.CGMPortal.formatDate(item.targetDate) + '</small>' : '') +
      '</article>';
  }

  function renderPhotos(data) {
    var images = data.images || [];
    var body = document.getElementById('pageBody');
    body.innerHTML =
      '<section class="portal-section"><div class="section-heading-row"><div><h2>Photo record <span class="count-pill">' + images.length + '</span></h2><p>Photographs remain private to this household and CGM.</p></div></div>' +
      '<div class="photo-filter" role="group" aria-label="Filter photos"><button class="is-active" data-photo-filter="all">All photos</button><button data-photo-filter="progress">Progress</button><button data-photo-filter="before_after">Before / after</button><button data-photo-filter="client_upload">Your uploads</button></div>' +
      (images.length ? '<div id="photoGrid" class="portfolio-grid portal-photo-grid">' + images.map(renderPhoto).join('') + '</div>' : empty('No photographs yet', 'As CGM documents your garden, a private before-and-after record will appear here.')) +
      '</section>';
    bindPhotoFilters();
    bindPhotoLightbox();
  }

  function renderPhoto(image) {
    var category = image.category || 'progress';
    var label = { progress: 'Progress', before_after: 'Before / after', reference: 'Reference', client_upload: 'Your upload' }[category] || 'Garden image';
    return '<button class="portal-photo" type="button" data-category="' + window.CGMPortal.escapeHtml(category) + '" data-url="' + window.CGMPortal.escapeHtml(image.url) + '" data-caption="' + window.CGMPortal.escapeHtml(image.caption || image.filename) + '">' +
      '<img src="' + window.CGMPortal.escapeHtml(image.url) + '" alt="' + window.CGMPortal.escapeHtml(image.caption || image.filename) + '" loading="lazy">' +
      '<span><strong>' + label + '</strong>' + (image.caption ? '<em>' + window.CGMPortal.escapeHtml(image.caption) + '</em>' : '') + '</span></button>';
  }

  function bindPhotoFilters() {
    document.querySelectorAll('[data-photo-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-photo-filter');
        document.querySelectorAll('[data-photo-filter]').forEach(function (item) { item.classList.toggle('is-active', item === button); });
        document.querySelectorAll('.portal-photo').forEach(function (photo) {
          photo.hidden = filter !== 'all' && photo.getAttribute('data-category') !== filter;
        });
      });
    });
  }

  function bindPhotoLightbox() {
    document.querySelectorAll('.portal-photo').forEach(function (button) {
      button.addEventListener('click', function () {
        var overlay = document.createElement('div');
        overlay.className = 'lightbox';
        overlay.innerHTML = '<button class="lb-close" aria-label="Close photograph">&times;</button><img src="' + button.dataset.url + '" alt="' + button.dataset.caption + '"><p>' + button.dataset.caption + '</p>';
        overlay.addEventListener('click', function () { overlay.remove(); document.body.style.overflow = ''; });
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function renderMessages(data, context) {
    var body = document.getElementById('pageBody');
    body.innerHTML =
      '<div class="portal-grid messages-grid"><section class="portal-section"><h2>Send CGM a message</h2><p class="section-intro">Use this for garden questions, requests or information you would like us to see before the next visit.</p>' +
      '<div id="messageAlert" class="alert" hidden></div><div class="composer"><textarea id="messageBody" maxlength="8000" placeholder="Write a private message to CGM…"></textarea><div class="composer-row"><span class="char-count"><span id="messageCount">0</span> / 8000</span><button id="sendMessageBtn" type="button" class="btn-portal btn-primary">Send message</button></div></div></section>' +
      '<section class="portal-section"><h2>Conversation <span class="count-pill">' + (data.notes || []).length + '</span></h2><div class="message-list">' +
      ((data.notes || []).length ? data.notes.map(renderMessage).join('') : empty('No messages yet', 'The conversation with CGM will appear here.')) + '</div></section></div>';
    document.getElementById('messageBody').addEventListener('input', function () { document.getElementById('messageCount').textContent = this.value.length; });
    document.getElementById('sendMessageBtn').addEventListener('click', function () { sendMessage(context); });
  }

  function renderMessage(note) {
    var from = note.authorType === 'admin' ? 'Chiltern Garden Maintenance' : 'You';
    var tag = note.noteType === 'visit' ? 'Visit update' : note.authorType === 'admin' ? 'CGM update' : 'Your message';
    return '<article class="note-card ' + (note.authorType === 'admin' ? 'admin-note' : 'client-note') + '"><div class="note-head"><strong class="note-author">' + from + '</strong><span class="note-meta"><span class="note-tag ' + (note.noteType === 'visit' ? 'visit' : note.authorType === 'admin' ? 'update' : 'client') + '">' + tag + '</span>' + window.CGMPortal.formatRelative(note.createdAt) + '</span></div>' +
      (note.title ? '<h3 class="note-title">' + window.CGMPortal.escapeHtml(note.title) + '</h3>' : '') + '<p class="note-body">' + nl2br(note.body) + '</p></article>';
  }

  async function sendMessage(context) {
    var input = document.getElementById('messageBody');
    var button = document.getElementById('sendMessageBtn');
    var alert = document.getElementById('messageAlert');
    var body = input.value.trim();
    if (!body) return;
    button.disabled = true; button.textContent = 'Sending…';
    try {
      var payload = { body: body };
      if (context.isAdmin) { payload.clientId = context.clientId; payload.noteType = 'update'; }
      var response = await fetch('/api/client-note', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      var result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Unable to send message.');
      window.location.reload();
    } catch (error) {
      alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = error.message || 'Unable to send your message.';
      button.disabled = false; button.textContent = 'Send message';
    }
  }

  function renderAccount(data) {
    var client = data.client;
    var body = document.getElementById('pageBody');
    body.innerHTML = '<div class="account-grid"><section class="portal-section"><h2>Household profile</h2><dl class="profile-list"><div><dt>Household</dt><dd>' + window.CGMPortal.escapeHtml(client.householdName) + '</dd></div><div><dt>Username</dt><dd>@' + window.CGMPortal.escapeHtml(client.username) + '</dd></div><div><dt>Email</dt><dd>' + window.CGMPortal.escapeHtml(client.email) + '</dd></div><div><dt>Service area</dt><dd>' + window.CGMPortal.escapeHtml(client.serviceArea || '—') + '</dd></div></dl><p class="section-intro">Need to change any household details? <a href="/contact/">Contact CGM</a>.</p></section>' +
      '<section class="portal-section"><h2>Change password</h2><p class="section-intro">Use a memorable passphrase of at least 12 characters. Changing it signs out other devices.</p><div id="accountAlert" class="alert" hidden></div><form id="passwordForm"><div class="field"><label for="currentPassword">Current password</label><input type="password" id="currentPassword" autocomplete="current-password" required></div><div class="field"><label for="newPassword">New password</label><input type="password" id="newPassword" autocomplete="new-password" minlength="12" required></div><div class="field"><label for="confirmPassword">Confirm new password</label><input type="password" id="confirmPassword" autocomplete="new-password" minlength="12" required></div><button class="btn-portal btn-primary" type="submit" id="passwordSubmit">Update password</button></form></section></div>';
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
  }

  async function changePassword(event) {
    event.preventDefault();
    var currentPassword = document.getElementById('currentPassword').value;
    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    var alert = document.getElementById('accountAlert');
    var button = document.getElementById('passwordSubmit');
    if (newPassword !== confirmPassword) { showAccountAlert('New passwords do not match.', 'error'); return; }
    button.disabled = true; button.textContent = 'Updating…';
    try {
      var response = await fetch('/api/auth-password-change', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword }) });
      var result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Unable to update password.');
      document.getElementById('passwordForm').reset();
      alert.hidden = false; alert.className = 'alert alert-success'; alert.textContent = result.message;
    } catch (error) { showAccountAlert(error.message || 'Unable to update password.', 'error'); }
    button.disabled = false; button.textContent = 'Update password';
  }

  function showAccountAlert(message, type) {
    var alert = document.getElementById('accountAlert');
    alert.hidden = false; alert.className = 'alert alert-' + type; alert.textContent = message;
  }

  function stat(value, label) { return '<div class="portal-stat"><span>' + label + '</span><strong>' + value + '</strong></div>'; }
  function empty(title, copy) { return '<div class="empty-state"><div class="es-icon">&#10022;</div><h3>' + title + '</h3><p>' + copy + '</p></div>'; }
  function nl2br(value) { return window.CGMPortal.escapeHtml(value).replace(/\n/g, '<br>'); }
}());
