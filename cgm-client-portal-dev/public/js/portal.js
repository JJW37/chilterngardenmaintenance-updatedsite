/* Redesigned Garden Passport overview — all content is private and data-led. */
(function () {
  'use strict';

  var state = { context: null, data: null };
  var $ = function (id) { return document.getElementById(id); };
  var escapeHtml = function (value) { return window.CGMPortal.escapeHtml(value); };
  var formatDate = function (value, options) { return window.CGMPortal.formatDate(value, options); };
  var formatRelative = function (value) { return window.CGMPortal.formatRelative(value); };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      state.context = await window.CGMPortal.getContext();
      if (!state.context) return window.CGMPortal.showPageState('unauthorised');
      if (state.context.needsClientSelection) return window.CGMPortal.showClientSelection();
      await refresh();
      window.CGMPortal.showPageState('content');
    } catch (error) {
      console.error('[portal-overview]', error);
      window.CGMPortal.showPageState('unauthorised');
    }
  }

  async function refresh() {
    state.data = await window.CGMPortal.getData(state.context);
    render();
  }

  function render() {
    var data = state.data;
    var client = data.client;
    document.title = client.householdName + ' | Garden Passport | CGM';
    var activePlan = (data.planItems || []).filter(function (item) { return item.status !== 'complete'; });
    var completedVisits = (data.visits || []).filter(function (visit) { return visit.status === 'completed'; });
    var content = $('portalContent');
    content.innerHTML =
      adminBanner() +
      '<div class="passport-masthead">' +
        '<div><span class="eyebrow"><span class="eyebrow-dot"></span> Private Garden Passport</span>' +
        '<h1>' + escapeHtml(client.householdName) + '</h1>' +
        '<p>' + escapeHtml(client.addressLine || client.serviceArea || 'Your private CGM garden record') + '</p></div>' +
        '<div class="passport-masthead-actions">' +
          '<a class="btn-portal btn-ghost" href="/portal/messages/' + clientQuery() + '">Messages' + (data.unreadMessages ? ' <span class="notification-dot" aria-label="' + data.unreadMessages + ' unread messages">' + data.unreadMessages + '</span>' : '') + '</a>' +
          '<a class="btn-portal btn-gold" href="/portal/plan/' + clientQuery() + '">Garden plan</a>' +
        '</div>' +
      '</div>' +
      portalNav('overview') +
      renderNextVisit(data.nextVisit) +
      '<section class="passport-stat-row" aria-label="Garden summary">' +
        metric(activePlan.length, 'Active priorities', 'View plan', '/portal/plan/') +
        metric(completedVisits.length, 'Recorded visits', 'Visit history', '/portal/history/') +
        metric(data.images ? data.images.length : 0, 'Private photos', 'View photos', '/portal/photos/') +
        metric(data.unreadMessages || 0, data.unreadMessages === 1 ? 'Unread message' : 'Unread messages', 'Open messages', '/portal/messages/') +
      '</section>' +
      '<div class="passport-overview-grid">' +
        '<section class="passport-panel passport-focus-panel">' + renderFocus(data.nextVisit, activePlan) + '</section>' +
        '<aside class="passport-panel passport-action-panel">' + renderActionCentre(data) + '</aside>' +
        '<section class="passport-panel passport-season-panel">' + renderSeasonalPlan(activePlan) + '</section>' +
        '<section class="passport-panel passport-activity-panel">' + renderActivity(data) + '</section>' +
        '<section class="passport-panel passport-feedback-panel">' + renderFeedbackPrompt(completedVisits) + '</section>' +
      '</div>' +
      '<section class="passport-privacy-note"><strong>Private by design.</strong> Your garden details, messages, photographs and invoices are visible only to your household and Chiltern Garden Maintenance.</section>';

    window.CGMPortal.setupNavigation(state.context, 'overview');
    bindActions();
  }

  function clientQuery() {
    return window.CGMPortal.clientQuery(state.context);
  }

  function adminBanner() {
    return state.context.isAdmin
      ? '<div id="adminBanner" class="alert alert-info passport-admin-banner"><strong>Admin view.</strong> You are managing this household’s private Garden Passport. <a href="/portal/admin/dashboard/">Back to dashboard</a></div>'
      : '';
  }

  function portalNav(active) {
    var links = [
      ['overview', '/portal/', 'Overview'], ['history', '/portal/history/', 'Visit history'],
      ['plan', '/portal/plan/', 'Garden plan'], ['photos', '/portal/photos/', 'Photos'],
      ['messages', '/portal/messages/', 'Messages'], ['invoices', '/portal/invoices/', 'Invoices'], ['account', '/portal/account/', 'Account'],
    ];
    return '<nav id="portalNav" class="portal-nav passport-nav" aria-label="Your Garden Passport">' + links.map(function (link) {
      return '<a data-portal-path="' + link[1] + '" data-portal-key="' + link[0] + '"' + (active === link[0] ? ' aria-current="page"' : '') + '>' + link[2] + '</a>';
    }).join('') + '</nav>';
  }

  function renderNextVisit(visit) {
    if (!visit) {
      return '<section class="next-visit-hero is-empty"><div><span class="eyebrow">Next visit</span><h2>Your next visit is being arranged</h2><p>CGM will add the date, arrival window and intended work here once it is confirmed.</p></div><a class="btn-portal btn-primary" href="/portal/messages/' + clientQuery() + '">Ask CGM a question</a></section>';
    }
    var status = { scheduled: 'Awaiting your confirmation', confirmed: 'Confirmed', reschedule_requested: 'Reschedule requested' }[visit.status] || visit.status.replace(/_/g, ' ');
    var tasks = (visit.tasks || []).slice(0, 4);
    var taskHtml = tasks.length ? '<ul class="next-visit-task-list">' + tasks.map(function (task) { return '<li><span class="task-tick">✓</span>' + escapeHtml(task.title) + (task.area ? '<small>' + escapeHtml(task.area) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted-copy">CGM has not added a work list for this visit yet.</p>';
    var controls = state.context.isAdmin
      ? '<a class="btn-portal btn-ghost" href="/portal/history/' + clientQuery() + '">Manage visit</a>'
      : visit.status === 'scheduled'
        ? '<div class="next-visit-controls"><button class="btn-portal btn-gold" type="button" data-visit-confirm="' + visit.id + '">Confirm visit</button><button class="btn-portal btn-ghost" type="button" data-visit-reschedule="' + visit.id + '">Need a different time?</button></div>'
        : visit.status === 'confirmed'
          ? '<div class="next-visit-controls"><span class="visit-confirmed-mark">✓ Visit confirmed</span><button class="text-button" type="button" data-visit-reschedule="' + visit.id + '">Request a change</button></div>'
          : '<div class="next-visit-controls"><span class="visit-confirmed-mark">We have your request</span><a class="text-button" href="/portal/messages/' + clientQuery() + '">View conversation</a></div>';
    return '<section class="next-visit-hero">' +
      '<div class="next-visit-date-block"><span class="eyebrow">Next visit</span><h2>' + escapeHtml(formatDate(visit.scheduledStart, { weekday: 'long', day: 'numeric', month: 'long' })) + '</h2><p>' + escapeHtml(visit.arrivalWindow || 'Time to be confirmed') + (visit.gardenerName ? ' <span class="hero-separator">·</span> ' + escapeHtml(visit.gardenerName) : '') + '</p><span class="visit-status status-' + escapeHtml(visit.status) + '">' + escapeHtml(status) + '</span></div>' +
      '<div class="next-visit-work"><h3>Planned work</h3>' + taskHtml + '</div>' +
      '<div class="next-visit-actions">' + controls + '</div>' +
    '</section>';
  }

  function metric(value, label, action, path) {
    return '<a class="passport-metric" href="' + path + clientQuery() + '"><strong>' + escapeHtml(value) + '</strong><span>' + escapeHtml(label) + '</span><small>' + escapeHtml(action) + ' →</small></a>';
  }

  function renderFocus(visit, activePlan) {
    var focusItems = visit && visit.tasks && visit.tasks.length ? visit.tasks : activePlan.slice(0, 4);
    var title = visit ? 'This visit’s focus' : 'What CGM is planning next';
    var intro = visit ? 'The work list for your next visit is visible before CGM arrives.' : 'Seasonal priorities will move into the visit work list as they are scheduled.';
    return '<div class="panel-heading"><div><span class="eyebrow">Garden work</span><h2>' + title + '</h2><p>' + intro + '</p></div><a class="text-button" href="/portal/plan/' + clientQuery() + '">Full plan</a></div>' +
      (focusItems.length ? '<div class="focus-list">' + focusItems.map(function (item) {
        var stateLabel = item.status === 'complete' ? 'Completed' : item.status === 'in_progress' ? 'In progress' : 'Planned';
        return '<article><span class="focus-priority priority-' + escapeHtml(item.priority || 'recommended') + '"></span><div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.detail || item.area || 'CGM priority') + '</p></div><span class="focus-state">' + stateLabel + '</span></article>';
      }).join('') + '</div>' : empty('No work items have been assigned yet', 'Once CGM confirms seasonal priorities, you will see them here.'));
  }

  function renderActionCentre(data) {
    var invoice = (data.outstandingInvoices || [])[0];
    var rows = [];
    if (invoice) {
      rows.push('<a class="action-centre-item action-invoice" href="/portal/invoices/' + clientQuery() + '"><span>£</span><div><strong>' + (invoice.status === 'overdue' ? 'Invoice needs attention' : 'Invoice due ' + escapeHtml(formatDate(invoice.dueDate, { day: 'numeric', month: 'short' }))) + '</strong><small>' + escapeHtml(invoice.invoiceNumber) + ' · £' + Number(invoice.balanceDue || 0).toFixed(2) + ' outstanding</small></div><b>View →</b></a>');
    }
    if (data.unreadMessages) {
      rows.push('<a class="action-centre-item" href="/portal/messages/' + clientQuery() + '"><span>✉</span><div><strong>' + data.unreadMessages + ' unread ' + (data.unreadMessages === 1 ? 'message' : 'messages') + '</strong><small>Open your private conversation with CGM</small></div><b>Read →</b></a>');
    }
    if (data.nextVisit && data.nextVisit.status === 'scheduled' && !state.context.isAdmin) {
      rows.push('<button class="action-centre-item action-button" type="button" data-visit-confirm="' + data.nextVisit.id + '"><span>✓</span><div><strong>Confirm your next visit</strong><small>Let CGM know that this time works for you</small></div><b>Confirm →</b></button>');
    }
    if (!rows.length) rows.push('<div class="action-centre-clear"><span>✓</span><strong>Nothing needs your attention</strong><p>CGM will flag anything that needs a decision here.</p></div>');
    return '<div class="panel-heading"><div><span class="eyebrow">Action centre</span><h2>At a glance</h2></div></div><div class="action-centre-list">' + rows.join('') + '</div>';
  }

  function renderSeasonalPlan(items) {
    return '<div class="panel-heading"><div><span class="eyebrow">Seasonal direction</span><h2>Garden plan</h2><p>CGM’s shared priorities, updated as your garden develops.</p></div><a class="text-button" href="/portal/plan/' + clientQuery() + '">Open plan</a></div>' +
      (items.length ? '<div class="season-mini-grid">' + items.slice(0, 3).map(function (item) {
        return '<article class="season-mini-card"><span>' + escapeHtml(item.season || 'All year') + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.detail || 'CGM recommendation') + '</p><footer><b class="plan-pill priority-' + escapeHtml(item.priority) + '">' + escapeHtml(item.priority || 'recommended') + '</b>' + (item.targetDate ? '<small>Target ' + escapeHtml(formatDate(item.targetDate, { day: 'numeric', month: 'short' })) + '</small>' : '') + '</footer></article>';
      }).join('') + '</div>' : empty('Your garden plan is being prepared', 'After the first planning visit, priorities and recommendations will appear here.'));
  }

  function renderActivity(data) {
    var events = [];
    (data.visits || []).filter(function (visit) { return visit.status === 'completed'; }).slice(0, 2).forEach(function (visit) {
      events.push({ icon: '✓', title: 'Visit completed', body: visit.summary || 'CGM recorded completed work.', date: visit.completedAt || visit.scheduledStart, href: '/portal/history/' + clientQuery() });
    });
    (data.notes || []).filter(function (note) { return note.noteType !== 'visit'; }).slice(0, 2).forEach(function (note) {
      events.push({ icon: note.authorType === 'admin' ? '✦' : '✉', title: note.title || (note.authorType === 'admin' ? 'CGM update' : 'Household note'), body: note.body, date: note.createdAt, href: '/portal/messages/' + clientQuery() });
    });
    if (data.lastMessage) events.push({ icon: '✉', title: data.lastMessage.senderType === 'admin' ? 'Latest message from CGM' : 'Latest message sent', body: data.lastMessage.body, date: data.lastMessage.createdAt, href: '/portal/messages/' + clientQuery() });
    events.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); });
    return '<div class="panel-heading"><div><span class="eyebrow">Recent activity</span><h2>Your garden record</h2></div><a class="text-button" href="/portal/history/' + clientQuery() + '">Full history</a></div>' +
      (events.length ? '<div class="activity-list">' + events.slice(0, 4).map(function (event) {
        return '<a href="' + event.href + '"><span class="activity-icon">' + event.icon + '</span><div><h3>' + escapeHtml(event.title) + '</h3><p>' + escapeHtml(truncate(event.body, 155)) + '</p></div><time>' + escapeHtml(formatRelative(event.date)) + '</time></a>';
      }).join('') + '</div>' : empty('Your record starts here', 'Visit notes, messages, photographs and invoices will appear as CGM adds them.'));
  }

  function renderFeedbackPrompt(completedVisits) {
    var visit = completedVisits.find(function (item) { return !item.feedback; });
    if (!visit || state.context.isAdmin) {
      var feedbacks = completedVisits.filter(function (item) { return item.feedback; });
      if (state.context.isAdmin && feedbacks.length) {
        return '<div class="feedback-received"><span class="eyebrow">Client feedback</span><h2>' + feedbacks.length + ' visit ' + (feedbacks.length === 1 ? 'response' : 'responses') + '</h2><p>Feedback is recorded against each completed visit in the history.</p><a class="btn-portal btn-ghost" href="/portal/history/' + clientQuery() + '">Review visit history</a></div>';
      }
      return '<div class="feedback-received"><span class="eyebrow">Feedback pulse</span><h2>How is your garden care feeling?</h2><p>After a completed visit, a short feedback card appears here. It helps CGM keep the service responsive.</p></div>';
    }
    return '<div class="feedback-prompt"><div><span class="eyebrow">Feedback pulse</span><h2>How was your last visit?</h2><p>Tell CGM what worked well or what would make the next visit better. It takes less than a minute.</p><small>Visit ' + escapeHtml(formatDate(visit.scheduledStart, { day: 'numeric', month: 'long' })) + '</small></div><button class="btn-portal btn-gold" type="button" data-feedback-visit="' + visit.id + '">Leave feedback</button></div>';
  }

  function bindActions() {
    document.querySelectorAll('[data-visit-confirm]').forEach(function (button) {
      button.addEventListener('click', function () { confirmVisit(Number(button.dataset.visitConfirm)); });
    });
    document.querySelectorAll('[data-visit-reschedule]').forEach(function (button) {
      button.addEventListener('click', function () { openRescheduleModal(Number(button.dataset.visitReschedule)); });
    });
    document.querySelectorAll('[data-feedback-visit]').forEach(function (button) {
      button.addEventListener('click', function () { openFeedbackModal(Number(button.dataset.feedbackVisit)); });
    });
  }

  async function confirmVisit(visitId) {
    var buttons = document.querySelectorAll('[data-visit-confirm="' + visitId + '"]');
    buttons.forEach(function (button) { button.disabled = true; button.textContent = 'Confirming…'; });
    try {
      var response = await fetch('/api/client-visits', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm', visitId: visitId }) });
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to confirm this visit.');
      await refresh();
    } catch (error) {
      window.alert(error.message || 'Unable to confirm this visit.');
      buttons.forEach(function (button) { button.disabled = false; button.textContent = 'Confirm visit'; });
    }
  }

  function openRescheduleModal(visitId) {
    openModal('Request a different visit time',
      '<p class="section-intro">Tell CGM what would work better. This records a request; it does not cancel the visit until CGM confirms a new time.</p><div class="field"><label for="rescheduleMessage">What needs to change?</label><textarea id="rescheduleMessage" maxlength="2000" rows="5" placeholder="For example: We are away until Thursday afternoon."></textarea></div>',
      '<button type="button" class="btn-portal btn-ghost" data-close-modal>Cancel</button><button type="button" class="btn-portal btn-primary" id="sendRescheduleRequest">Send request</button>',
      function (modal) {
        modal.querySelector('#sendRescheduleRequest').addEventListener('click', async function () {
          var button = modal.querySelector('#sendRescheduleRequest');
          var message = modal.querySelector('#rescheduleMessage').value.trim();
          if (!message) return modalAlert(modal, 'Please add a short message for CGM.');
          button.disabled = true; button.textContent = 'Sending…';
          try {
            var response = await fetch('/api/client-visits', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'request-reschedule', visitId: visitId, message: message }) });
            var result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to send request.');
            modal.remove(); await refresh();
          } catch (error) { modalAlert(modal, error.message || 'Unable to send request.'); button.disabled = false; button.textContent = 'Send request'; }
        });
      }
    );
  }

  function openFeedbackModal(visitId) {
    var tags = ['Punctual', 'Careful work', 'Good communication', 'Plant knowledge', 'Tidy finish', 'Helpful advice'];
    openModal('Feedback on your visit',
      '<p class="section-intro">Your response is private to your household and CGM. You can update it later from this visit.</p><fieldset class="star-field"><legend>Overall rating</legend><div class="star-picker">' + [1, 2, 3, 4, 5].map(function (rating) { return '<label><input type="radio" name="visitRating" value="' + rating + '"' + (rating === 5 ? ' checked' : '') + '><span aria-label="' + rating + ' stars">★</span></label>'; }).join('') + '</div></fieldset><fieldset class="feedback-tag-field"><legend>What stood out?</legend>' + tags.map(function (tag) { return '<label><input type="checkbox" value="' + escapeHtml(tag) + '"><span>' + escapeHtml(tag) + '</span></label>'; }).join('') + '</fieldset><div class="field"><label for="feedbackComment">Anything else? <small>Optional</small></label><textarea id="feedbackComment" maxlength="2000" rows="4" placeholder="A short note for CGM"></textarea></div>',
      '<button type="button" class="btn-portal btn-ghost" data-close-modal>Cancel</button><button type="button" class="btn-portal btn-gold" id="saveFeedbackBtn">Save feedback</button>',
      function (modal) {
        modal.querySelector('#saveFeedbackBtn').addEventListener('click', async function () {
          var button = modal.querySelector('#saveFeedbackBtn');
          var rating = Number((modal.querySelector('input[name="visitRating"]:checked') || {}).value || 0);
          var tagsSelected = Array.prototype.map.call(modal.querySelectorAll('.feedback-tag-field input:checked'), function (input) { return input.value; });
          button.disabled = true; button.textContent = 'Saving…';
          try {
            var response = await fetch('/api/client-feedback', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitId: visitId, rating: rating, tags: tagsSelected, comment: modal.querySelector('#feedbackComment').value }) });
            var result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to save feedback.');
            modal.remove(); await refresh();
          } catch (error) { modalAlert(modal, error.message || 'Unable to save feedback.'); button.disabled = false; button.textContent = 'Save feedback'; }
        });
      }
    );
  }

  function openModal(title, body, footer, onReady) {
    var modal = document.createElement('div');
    modal.className = 'modal-backdrop passport-modal-backdrop';
    modal.innerHTML = '<div class="modal passport-modal" role="dialog" aria-modal="true" aria-labelledby="passportModalTitle"><div class="modal-head"><h3 id="passportModalTitle">' + escapeHtml(title) + '</h3><button type="button" class="modal-close" data-close-modal aria-label="Close">×</button></div><div class="modal-body"><div class="alert alert-error" data-modal-alert hidden></div>' + body + '</div><div class="modal-foot">' + footer + '</div></div>';
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-modal]').forEach(function (button) { button.addEventListener('click', function () { modal.remove(); }); });
    modal.addEventListener('click', function (event) { if (event.target === modal) modal.remove(); });
    var first = modal.querySelector('textarea, input, button'); if (first) first.focus();
    if (onReady) onReady(modal);
  }

  function modalAlert(modal, message) {
    var alert = modal.querySelector('[data-modal-alert]');
    alert.hidden = false; alert.textContent = message;
  }

  function empty(title, copy) {
    return '<div class="passport-empty"><span>✦</span><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p></div>';
  }

  function truncate(value, length) {
    var text = String(value || '');
    return text.length > length ? text.slice(0, length - 1) + '…' : text;
  }
}());
