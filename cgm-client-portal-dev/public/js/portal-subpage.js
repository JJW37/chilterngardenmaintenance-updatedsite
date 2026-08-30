/* Garden Passport detail screens: visits, plan, photos, messages and account. */
(function () {
  'use strict';

  var state = { context: null, data: null, page: null, planSeason: 'All' };
  var escapeHtml = function (value) { return window.CGMPortal.escapeHtml(value); };
  var formatDate = function (value, options) { return window.CGMPortal.formatDate(value, options); };
  var formatRelative = function (value) { return window.CGMPortal.formatRelative(value); };
  var $ = function (id) { return document.getElementById(id); };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    state.page = document.body.getAttribute('data-portal-page');
    try {
      state.context = await window.CGMPortal.getContext();
      if (!state.context) return window.CGMPortal.showPageState('unauthorised');
      if (state.context.needsClientSelection) return window.CGMPortal.showClientSelection();
      await refreshPage();
      window.CGMPortal.showPageState('content');
    } catch (error) {
      console.error('[portal-subpage]', error);
      window.CGMPortal.showPageState('unauthorised');
    }
  }

  async function refreshPage() {
    state.data = await window.CGMPortal.getData(state.context);
    renderShell();
    if (state.page === 'history') renderHistory();
    else if (state.page === 'plan') renderPlan();
    else if (state.page === 'photos') renderPhotos();
    else if (state.page === 'messages') await renderMessages();
    else if (state.page === 'account') renderAccount();
  }

  function clientQuery() { return window.CGMPortal.clientQuery(state.context); }

  function nav(active) {
    var links = [
      ['overview', '/portal/', 'Overview'], ['history', '/portal/history/', 'Visit history'],
      ['plan', '/portal/plan/', 'Garden plan'], ['photos', '/portal/photos/', 'Photos'],
      ['messages', '/portal/messages/', 'Messages'], ['invoices', '/portal/invoices/', 'Invoices'], ['account', '/portal/account/', 'Account'],
    ];
    return '<nav id="portalNav" class="portal-nav passport-nav" aria-label="Your Garden Passport">' + links.map(function (link) {
      return '<a data-portal-path="' + link[1] + '" data-portal-key="' + link[0] + '"' + (active === link[0] ? ' aria-current="page"' : '') + '>' + link[2] + '</a>';
    }).join('') + '</nav>';
  }

  function pageLabel(page) {
    return {
      history: ['Visit history', 'Scheduled visits, completed work, feedback and your historic garden record.'],
      plan: ['Garden plan', 'A shared seasonal direction that CGM keeps up to date as your garden develops.'],
      photos: ['Garden photographs', 'A private visual record, organised by garden area and visit.'],
      messages: ['Messages', 'A direct, two-way conversation between your household and CGM.'],
      account: ['Account & security', 'Your household profile and private portal access.'],
    }[page] || ['Garden Passport', ''];
  }

  function renderShell() {
    var labels = pageLabel(state.page);
    var client = state.data.client;
    document.title = labels[0] + ' | ' + client.householdName + ' | CGM';
    var content = $('portalContent');
    content.innerHTML =
      (state.context.isAdmin ? '<div id="adminBanner" class="alert alert-info passport-admin-banner"><strong>Admin view.</strong> You are viewing this household’s private Garden Passport. <a href="/portal/admin/dashboard/">Back to dashboard</a></div>' : '') +
      '<div class="passport-page-header"><div><span class="eyebrow">Private Garden Passport</span><h1>' + escapeHtml(labels[0]) + '</h1><p>' + escapeHtml(labels[1]) + '</p></div><div class="passport-header-meta"><span class="portal-badge">' + escapeHtml(client.householdName) + '</span>' + (client.serviceArea ? '<span>' + escapeHtml(client.serviceArea) + '</span>' : '') + '</div></div>' +
      nav(state.page) + '<div id="pageBody"></div>';
    window.CGMPortal.setupNavigation(state.context, state.page);
  }

  /* ------------------------------------------------------------------------ */
  /* Visit history                                                            */
  /* ------------------------------------------------------------------------ */
  function renderHistory() {
    var body = $('pageBody');
    var visits = state.data.visits || [];
    var completed = visits.filter(function (visit) { return visit.status === 'completed'; });
    var upcoming = visits.filter(function (visit) { return !['completed', 'cancelled'].includes(visit.status); });
    var legacyVisits = (state.data.notes || []).filter(function (note) { return note.noteType === 'visit'; });
    body.innerHTML =
      '<section class="passport-history-stats">' +
        historyMetric(upcoming.length, 'Upcoming or awaiting response') +
        historyMetric(completed.length, 'Structured visits completed') +
        historyMetric(legacyVisits.length, 'Earlier visit notes') +
      '</section>' +
      '<section class="passport-section"><header><div><span class="eyebrow">Live schedule</span><h2>Visits and work lists</h2><p>Each scheduled visit has a date, work list and current status. CGM can update these records; your household can confirm or request a different time.</p></div>' +
        (state.context.isAdmin ? '<div class="section-actions"><button class="btn-portal btn-gold" id="scheduleVisitBtn" type="button">+ Schedule visit</button></div>' : '') +
      '</header>' +
      (visits.length ? '<div class="visit-record-list">' + visits.map(renderVisitRecord).join('') + '</div>' : empty('No scheduled visits yet', state.context.isAdmin ? 'Schedule the first visit to give this household a live, confirmable schedule.' : 'CGM will add your next visit here once it is arranged.')) +
      '</section>' +
      '<section class="passport-section legacy-history-section"><header><div><span class="eyebrow">Historical record</span><h2>Earlier visit notes</h2><p>Existing records remain available alongside the new visit workflow.</p></div></header>' +
        (legacyVisits.length ? '<div class="legacy-visit-list">' + legacyVisits.map(function (note) {
          return '<article><time>' + escapeHtml(formatDate(note.visitDate || note.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })) + '</time><div><h3>' + escapeHtml(note.title || 'Garden visit') + '</h3><p>' + nl2br(note.body) + '</p><small>Recorded ' + escapeHtml(formatRelative(note.createdAt)) + '</small></div></article>';
        }).join('') + '</div>' : empty('No earlier visit notes', 'New completed visits will appear above with their work list and feedback.')) +
      '</section>';
    bindHistoryActions();
  }

  function historyMetric(value, label) {
    return '<div><strong>' + value + '</strong><span>' + escapeHtml(label) + '</span></div>';
  }

  function renderVisitRecord(visit) {
    var status = {
      scheduled: 'Awaiting confirmation', confirmed: 'Confirmed', reschedule_requested: 'Reschedule requested', completed: 'Completed', cancelled: 'Cancelled',
    }[visit.status] || visit.status;
    var tasks = visit.tasks || [];
    var actions = '';
    if (state.context.isAdmin) {
      actions = '<div class="visit-admin-actions"><button class="btn-portal btn-ghost btn-compact" type="button" data-visit-edit="' + visit.id + '">Edit</button>' +
        (visit.status !== 'completed' && visit.status !== 'cancelled' ? '<button class="btn-portal btn-primary btn-compact" type="button" data-visit-complete="' + visit.id + '">Mark completed</button>' : '') +
        '<button class="btn-portal btn-danger btn-compact" type="button" data-visit-delete="' + visit.id + '">Delete</button></div>';
    } else if (visit.status === 'scheduled') {
      actions = '<div class="visit-client-actions"><button class="btn-portal btn-gold btn-compact" type="button" data-visit-confirm="' + visit.id + '">Confirm visit</button><button class="btn-portal btn-ghost btn-compact" type="button" data-visit-reschedule="' + visit.id + '">Request a change</button></div>';
    } else if (visit.status === 'confirmed') {
      actions = '<div class="visit-client-actions"><span class="visit-confirmed-mark">✓ Confirmed</span><button class="text-button" type="button" data-visit-reschedule="' + visit.id + '">Request a change</button></div>';
    }
    var feedback = visit.feedback
      ? '<div class="visit-feedback-result"><span class="feedback-stars">' + '★'.repeat(visit.feedback.rating) + '<i>' + '★'.repeat(5 - visit.feedback.rating) + '</i></span><span>' + escapeHtml((visit.feedback.tags || []).join(' · ') || 'Feedback recorded') + '</span>' + (visit.feedback.comment ? '<p>“' + escapeHtml(visit.feedback.comment) + '”</p>' : '') + '</div>'
      : visit.status === 'completed'
        ? '<div class="visit-feedback-pending">' + (state.context.isAdmin ? 'The household has not left feedback yet.' : 'A feedback prompt is available on your overview.') + '</div>'
        : '';
    return '<article class="visit-record status-' + escapeHtml(visit.status) + '">' +
      '<div class="visit-record-marker"><time>' + escapeHtml(formatDate(visit.scheduledStart, { day: 'numeric', month: 'short' })) + '</time><small>' + escapeHtml(new Date(visit.scheduledStart).getFullYear() || '') + '</small></div>' +
      '<div class="visit-record-content"><header><div><span class="visit-status status-' + escapeHtml(visit.status) + '">' + escapeHtml(status) + '</span><h3>' + escapeHtml(formatDate(visit.scheduledStart, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</h3><p>' + escapeHtml(visit.arrivalWindow || 'Time to be confirmed') + (visit.gardenerName ? ' · ' + escapeHtml(visit.gardenerName) : '') + '</p></div>' + actions + '</header>' +
      (visit.summary ? '<div class="visit-summary"><strong>' + (visit.status === 'completed' ? 'Visit summary' : 'CGM note') + '</strong><p>' + nl2br(visit.summary) + '</p></div>' : '') +
      (tasks.length ? '<div class="visit-work-list"><h4>Work list</h4><ul>' + tasks.map(function (task) { return renderVisitTask(visit, task); }).join('') + '</ul></div>' : '') + feedback +
      '</div></article>';
  }

  function renderVisitTask(visit, task) {
    var label = { planned: 'Planned', in_progress: 'In progress', complete: 'Completed', flagged: 'Flagged' }[task.status] || task.status;
    var staffControl = state.context.isAdmin && task.status !== 'complete'
      ? '<button type="button" class="task-complete-button" data-task-complete="' + task.id + '" data-visit-id="' + visit.id + '">Mark complete</button>' : '';
    return '<li class="visit-task task-' + escapeHtml(task.status) + '"><span class="task-check">' + (task.status === 'complete' ? '✓' : '○') + '</span><div><strong>' + escapeHtml(task.title) + '</strong>' + (task.detail ? '<p>' + escapeHtml(task.detail) + '</p>' : '') + (task.area ? '<small>' + escapeHtml(task.area) + '</small>' : '') + '</div><span class="visit-task-status">' + escapeHtml(label) + '</span>' + staffControl + '</li>';
  }

  function bindHistoryActions() {
    var schedule = $('scheduleVisitBtn');
    if (schedule) schedule.addEventListener('click', function () { openVisitEditor(null); });
    document.querySelectorAll('[data-visit-edit]').forEach(function (button) {
      button.addEventListener('click', function () { openVisitEditor(findVisit(Number(button.dataset.visitEdit))); });
    });
    document.querySelectorAll('[data-visit-complete]').forEach(function (button) {
      button.addEventListener('click', function () { updateVisit({ action: 'update', visitId: Number(button.dataset.visitComplete), status: 'completed' }); });
    });
    document.querySelectorAll('[data-visit-delete]').forEach(function (button) {
      button.addEventListener('click', function () { deleteVisit(Number(button.dataset.visitDelete)); });
    });
    document.querySelectorAll('[data-task-complete]').forEach(function (button) {
      button.addEventListener('click', function () { updateVisit({ action: 'task-update', visitId: Number(button.dataset.visitId), taskId: Number(button.dataset.taskComplete), status: 'complete' }); });
    });
    document.querySelectorAll('[data-visit-confirm]').forEach(function (button) {
      button.addEventListener('click', function () { confirmVisit(Number(button.dataset.visitConfirm)); });
    });
    document.querySelectorAll('[data-visit-reschedule]').forEach(function (button) {
      button.addEventListener('click', function () { openRescheduleModal(Number(button.dataset.visitReschedule)); });
    });
  }

  function findVisit(id) { return (state.data.visits || []).find(function (visit) { return visit.id === id; }); }

  function openVisitEditor(visit) {
    var editing = Boolean(visit);
    var toLocalValue = function (value) {
      if (!value) return '';
      return String(value).slice(0, 16);
    };
    openModal(editing ? 'Edit visit' : 'Schedule a visit',
      '<div class="visit-editor-grid"><div class="field"><label for="visitScheduledStart">Date and time</label><input id="visitScheduledStart" type="datetime-local" value="' + escapeHtml(toLocalValue(visit && visit.scheduledStart)) + '" required></div><div class="field"><label for="visitArrivalWindow">Arrival window <small>Optional</small></label><input id="visitArrivalWindow" maxlength="120" placeholder="e.g. 9:00–11:00" value="' + escapeHtml(visit?.arrivalWindow || '') + '"></div><div class="field"><label for="visitGardener">Gardener <small>Optional</small></label><input id="visitGardener" maxlength="120" placeholder="e.g. CGM team" value="' + escapeHtml(visit?.gardenerName || '') + '"></div><div class="field"><label for="visitStatus">Status</label><select id="visitStatus">' + selectOptions(['scheduled', 'confirmed', 'reschedule_requested', 'completed', 'cancelled'], visit?.status || 'scheduled') + '</select></div></div><div class="field"><label for="visitSummary">CGM note / completed summary <small>Optional</small></label><textarea id="visitSummary" maxlength="8000" rows="4" placeholder="What should the household know about this visit?">' + escapeHtml(visit?.summary || '') + '</textarea></div>' +
      (!editing ? '<div class="field"><label for="visitTasks">Work list <small>One task per line; optional</small></label><textarea id="visitTasks" maxlength="4000" rows="5" placeholder="Prune and shape hedge\nCheck border soil moisture\nClear paths and terrace">' + escapeHtml('') + '</textarea></div>' : '<p class="section-intro">Existing work-list tasks can be marked complete from the visit card. New tasks are added when scheduling a visit.</p>'),
      '<button class="btn-portal btn-ghost" type="button" data-close-modal>Cancel</button><button class="btn-portal btn-primary" type="button" id="saveVisitBtn">' + (editing ? 'Save visit' : 'Schedule visit') + '</button>',
      function (modal) {
        modal.querySelector('#saveVisitBtn').addEventListener('click', async function () {
          var button = modal.querySelector('#saveVisitBtn');
          var scheduledStart = modal.querySelector('#visitScheduledStart').value;
          if (!scheduledStart) return modalAlert(modal, 'Choose a date and time for the visit.');
          var payload = {
            action: editing ? 'update' : 'create', clientId: state.context.clientId, visitId: editing ? visit.id : undefined,
            scheduledStart: scheduledStart, arrivalWindow: modal.querySelector('#visitArrivalWindow').value,
            gardenerName: modal.querySelector('#visitGardener').value, status: modal.querySelector('#visitStatus').value,
            summary: modal.querySelector('#visitSummary').value,
          };
          if (!editing) payload.tasks = modal.querySelector('#visitTasks').value.split('\n').map(function (title) { return { title: title.trim() }; }).filter(function (task) { return task.title; });
          button.disabled = true; button.textContent = 'Saving…';
          try {
            var result = await postJson('/api/client-visits', payload);
            if (!result.ok) throw new Error(result.error || 'Unable to save visit.');
            modal.remove(); await refreshPage();
          } catch (error) { modalAlert(modal, error.message || 'Unable to save visit.'); button.disabled = false; button.textContent = editing ? 'Save visit' : 'Schedule visit'; }
        });
      }
    );
  }

  async function updateVisit(payload) {
    payload.clientId = state.context.clientId;
    try {
      var result = await postJson('/api/client-visits', payload);
      if (!result.ok) throw new Error(result.error || 'Unable to update visit.');
      await refreshPage();
    } catch (error) { window.alert(error.message || 'Unable to update visit.'); }
  }

  async function deleteVisit(visitId) {
    if (!window.confirm('Delete this visit and its work list? This cannot be undone.')) return;
    await updateVisit({ action: 'delete', visitId: visitId });
  }

  async function confirmVisit(visitId) {
    try {
      var result = await postJson('/api/client-visits', { action: 'confirm', visitId: visitId });
      if (!result.ok) throw new Error(result.error || 'Unable to confirm visit.');
      await refreshPage();
    } catch (error) { window.alert(error.message || 'Unable to confirm visit.'); }
  }

  function openRescheduleModal(visitId) {
    openModal('Request a different visit time',
      '<p class="section-intro">This sends a clear request to CGM. The current visit stays in place until a new time is agreed.</p><div class="field"><label for="rescheduleMessage">What would work better?</label><textarea id="rescheduleMessage" maxlength="2000" rows="5" placeholder="For example: Could we move this to Friday afternoon?"></textarea></div>',
      '<button class="btn-portal btn-ghost" type="button" data-close-modal>Cancel</button><button class="btn-portal btn-primary" type="button" id="requestRescheduleBtn">Send request</button>',
      function (modal) {
        modal.querySelector('#requestRescheduleBtn').addEventListener('click', async function () {
          var button = modal.querySelector('#requestRescheduleBtn');
          var message = modal.querySelector('#rescheduleMessage').value.trim();
          if (!message) return modalAlert(modal, 'Add a short note for CGM.');
          button.disabled = true; button.textContent = 'Sending…';
          try {
            var result = await postJson('/api/client-visits', { action: 'request-reschedule', visitId: visitId, message: message });
            if (!result.ok) throw new Error(result.error || 'Unable to send request.');
            modal.remove(); await refreshPage();
          } catch (error) { modalAlert(modal, error.message || 'Unable to send request.'); button.disabled = false; button.textContent = 'Send request'; }
        });
      }
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Garden plan                                                              */
  /* ------------------------------------------------------------------------ */
  function renderPlan() {
    var allItems = state.data.planItems || [];
    var seasons = ['All'].concat(unique(allItems.map(function (item) { return item.season || 'All year'; })));
    if (!seasons.includes(state.planSeason)) state.planSeason = 'All';
    var items = state.planSeason === 'All' ? allItems : allItems.filter(function (item) { return (item.season || 'All year') === state.planSeason; });
    var active = items.filter(function (item) { return item.status !== 'complete'; });
    var body = $('pageBody');
    body.innerHTML =
      '<section class="passport-history-stats plan-stats">' + historyMetric(active.length, 'Active priorities') + historyMetric(items.filter(function (item) { return item.status === 'in_progress'; }).length, 'In progress') + historyMetric(items.filter(function (item) { return item.status === 'complete'; }).length, 'Completed') + '</section>' +
      '<section class="passport-section plan-kanban-section"><header><div><span class="eyebrow">Shared direction</span><h2>Seasonal priorities</h2><p>CGM remains responsible for the plan. Staff can move work between stages; households can see exactly what is planned and ask questions.</p></div><div class="section-actions">' + (state.context.isAdmin ? '<button class="btn-portal btn-gold" id="addPlanItemBtn" type="button">+ Add priority</button>' : '<a class="btn-portal btn-ghost" href="/portal/messages/' + clientQuery() + '">Ask about the plan</a>') + '</div></header>' +
      '<div class="passport-subnav" role="tablist" aria-label="Garden-plan seasons">' + seasons.map(function (season) { return '<button type="button" role="tab" data-season="' + escapeHtml(season) + '" class="' + (season === state.planSeason ? 'is-active' : '') + '">' + escapeHtml(season) + '</button>'; }).join('') + '</div>' +
      (items.length ? '<div class="plan-kanban" data-plan-board>' + renderPlanColumn('planned', 'Planned', items) + renderPlanColumn('in_progress', 'In progress', items) + renderPlanColumn('complete', 'Completed', items) + '</div>' : empty('No priorities for this season', state.context.isAdmin ? 'Add the first priority to start this household’s shared garden plan.' : 'CGM will add seasonal recommendations after the planning visit.')) +
      '</section>' + renderTwoWeekLookahead();
    bindPlanActions(allItems);
  }

  function renderPlanColumn(status, label, items) {
    var columnItems = items.filter(function (item) { return item.status === status; });
    return '<section class="plan-kanban-column status-' + status + '" data-plan-status="' + status + '"><header><h3>' + label + '</h3><span>' + columnItems.length + '</span></header><div class="plan-kanban-dropzone">' + (columnItems.length ? columnItems.map(renderPlanCard).join('') : '<p class="kanban-empty">No priorities here.</p>') + '</div></section>';
  }

  function renderTwoWeekLookahead() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var plannedVisits = state.data.visits || [];
    var planItems = state.data.planItems || [];
    var days = [];
    for (var offset = 0; offset < 14; offset += 1) {
      var day = new Date(today); day.setDate(today.getDate() + offset);
      var key = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
      var visit = plannedVisits.find(function (item) { return String(item.scheduledStart || '').slice(0, 10) === key && item.status !== 'cancelled'; });
      var targets = planItems.filter(function (item) { return item.targetDate === key && item.status !== 'complete'; });
      days.push('<article class="lookahead-day' + (offset === 0 ? ' is-today' : '') + '"><time><span>' + escapeHtml(day.toLocaleDateString('en-GB', { weekday: 'short' })) + '</span><strong>' + day.getDate() + '</strong></time>' + (visit ? '<a href="/portal/history/' + clientQuery() + '" title="View visit">' + escapeHtml(visit.status === 'confirmed' ? 'Visit confirmed' : 'Visit') + '</a>' : '') + targets.map(function (item) { return '<span class="lookahead-task" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</span>'; }).join('') + (!visit && !targets.length ? '<i>—</i>' : '') + '</article>');
    }
    return '<section class="passport-section plan-lookahead"><header><div><span class="eyebrow">Forward view</span><h2>Next 14 days</h2><p>Shows scheduled visits and plan targets recorded for this household. Add a date to a priority or schedule a visit to populate it.</p></div></header><div class="lookahead-grid">' + days.join('') + '</div></section>';
  }

  function renderPlanCard(item) {
    var controls = state.context.isAdmin ? '<div class="plan-card-actions"><button type="button" class="text-button" data-plan-edit="' + item.id + '">Edit</button><button type="button" class="text-button plan-delete-link" data-plan-delete="' + item.id + '">Delete</button></div>' : '';
    return '<article class="plan-kanban-card priority-' + escapeHtml(item.priority) + '" data-plan-card="' + item.id + '"' + (state.context.isAdmin ? ' draggable="true"' : '') + '><span class="plan-season">' + escapeHtml(item.season || 'All year') + '</span><h4>' + escapeHtml(item.title) + '</h4>' + (item.detail ? '<p>' + escapeHtml(item.detail) + '</p>' : '') + '<footer><span class="plan-pill priority-' + escapeHtml(item.priority) + '">' + escapeHtml(item.priority) + '</span>' + (item.area ? '<small>' + escapeHtml(item.area) + '</small>' : '') + (item.targetDate ? '<small>Target ' + escapeHtml(formatDate(item.targetDate, { day: 'numeric', month: 'short' })) + '</small>' : '') + '</footer>' + controls + '</article>';
  }

  function bindPlanActions(items) {
    var add = $('addPlanItemBtn');
    if (add) add.addEventListener('click', function () { openPlanEditor(null); });
    document.querySelectorAll('[data-season]').forEach(function (button) { button.addEventListener('click', function () { state.planSeason = button.dataset.season; renderPlan(); }); });
    document.querySelectorAll('[data-plan-edit]').forEach(function (button) { button.addEventListener('click', function () { openPlanEditor(items.find(function (item) { return item.id === Number(button.dataset.planEdit); })); }); });
    document.querySelectorAll('[data-plan-delete]').forEach(function (button) { button.addEventListener('click', function () { deletePlanItem(Number(button.dataset.planDelete)); }); });
    if (!state.context.isAdmin) return;
    document.querySelectorAll('[data-plan-card]').forEach(function (card) {
      card.addEventListener('dragstart', function (event) { event.dataTransfer.setData('text/plain', card.dataset.planCard); card.classList.add('is-dragging'); });
      card.addEventListener('dragend', function () { card.classList.remove('is-dragging'); document.querySelectorAll('[data-plan-status]').forEach(function (column) { column.classList.remove('is-drop-target'); }); });
    });
    document.querySelectorAll('[data-plan-status]').forEach(function (column) {
      column.addEventListener('dragover', function (event) { event.preventDefault(); column.classList.add('is-drop-target'); });
      column.addEventListener('dragleave', function () { column.classList.remove('is-drop-target'); });
      column.addEventListener('drop', function (event) { event.preventDefault(); column.classList.remove('is-drop-target'); updatePlanItem({ id: Number(event.dataTransfer.getData('text/plain')), status: column.dataset.planStatus }); });
    });
  }

  function openPlanEditor(item) {
    var values = item || { season: 'All year', title: '', detail: '', status: 'planned', priority: 'recommended', targetDate: '', area: '' };
    openModal(item ? 'Edit garden priority' : 'Add garden priority',
      '<div class="field"><label for="planTitle">Priority title</label><input id="planTitle" maxlength="200" value="' + escapeHtml(values.title) + '" placeholder="e.g. Autumn mulch and soil protection"></div><div class="field"><label for="planDetail">Recommendation / detail <small>Optional</small></label><textarea id="planDetail" maxlength="8000" rows="4" placeholder="What will be done, and why?">' + escapeHtml(values.detail || '') + '</textarea></div><div class="plan-form-grid"><div class="field"><label for="planSeason">Season</label><input id="planSeason" maxlength="80" value="' + escapeHtml(values.season || 'All year') + '"></div><div class="field"><label for="planArea">Garden area <small>Optional</small></label><input id="planArea" maxlength="80" value="' + escapeHtml(values.area || '') + '" placeholder="e.g. Front border"></div><div class="field"><label for="planTargetDate">Target date <small>Optional</small></label><input id="planTargetDate" type="date" value="' + escapeHtml(values.targetDate || '') + '"></div><div class="field"><label for="planPriority">Priority</label><select id="planPriority">' + selectOptions(['essential', 'recommended', 'optional'], values.priority) + '</select></div><div class="field"><label for="planStatus">Status</label><select id="planStatus">' + selectOptions(['planned', 'in_progress', 'complete'], values.status) + '</select></div></div>',
      '<button type="button" class="btn-portal btn-ghost" data-close-modal>Cancel</button><button id="savePlanBtn" type="button" class="btn-portal btn-primary">Save priority</button>',
      function (modal) {
        modal.querySelector('#savePlanBtn').addEventListener('click', async function () {
          var button = modal.querySelector('#savePlanBtn');
          var payload = { clientId: state.context.clientId, title: modal.querySelector('#planTitle').value, detail: modal.querySelector('#planDetail').value, season: modal.querySelector('#planSeason').value, area: modal.querySelector('#planArea').value, targetDate: modal.querySelector('#planTargetDate').value, priority: modal.querySelector('#planPriority').value, status: modal.querySelector('#planStatus').value };
          if (item) payload.id = item.id;
          button.disabled = true; button.textContent = 'Saving…';
          try {
            var response = await fetch('/api/admin-plan', { method: item ? 'PATCH' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            var result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to save priority.');
            modal.remove(); await refreshPage();
          } catch (error) { modalAlert(modal, error.message || 'Unable to save priority.'); button.disabled = false; button.textContent = 'Save priority'; }
        });
      }
    );
  }

  async function updatePlanItem(payload) {
    try {
      var result = await postJson('/api/admin-plan', payload, 'PATCH');
      if (!result.ok) throw new Error(result.error || 'Unable to update priority.');
      await refreshPage();
    } catch (error) { window.alert(error.message || 'Unable to update priority.'); }
  }

  async function deletePlanItem(id) {
    if (!window.confirm('Delete this garden-plan priority? This cannot be undone.')) return;
    try {
      var response = await fetch('/api/admin-plan?id=' + encodeURIComponent(id), { method: 'DELETE', credentials: 'include' });
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to delete priority.');
      await refreshPage();
    } catch (error) { window.alert(error.message || 'Unable to delete priority.'); }
  }

  /* ------------------------------------------------------------------------ */
  /* Photographs                                                               */
  /* ------------------------------------------------------------------------ */
  function renderPhotos() {
    var body = $('pageBody');
    var images = state.data.images || [];
    var areas = unique(images.map(function (image) { return image.area; }).filter(Boolean));
    var tags = unique(images.reduce(function (result, image) { return result.concat(image.tags || []); }, []));
    var pair = comparisonPair(images);
    body.innerHTML =
      (pair ? renderComparison(pair) : '') +
      '<section class="passport-section"><header><div><span class="eyebrow">Photo record</span><h2>Garden photographs <span class="count-pill">' + images.length + '</span></h2><p>Searchable private photographs, organised by the records CGM adds to each image.</p></div></header>' +
      '<div class="photo-filter-stack"><div class="photo-filter" role="group" aria-label="Filter photos"><button class="is-active" data-photo-filter="all" type="button">All photos</button><button data-photo-filter="progress" type="button">Progress</button><button data-photo-filter="before_after" type="button">Before / after</button><button data-photo-filter="client_upload" type="button">Your uploads</button></div>' +
      (areas.length ? '<div class="photo-area-filter"><strong>Garden area</strong>' + areas.map(function (area) { return '<button type="button" data-photo-area="' + escapeHtml(area) + '">' + escapeHtml(area) + '</button>'; }).join('') + '</div>' : '') +
      (tags.length ? '<div class="photo-tag-filter"><strong>Tags</strong>' + tags.map(function (tag) { return '<button type="button" data-photo-tag="' + escapeHtml(tag) + '">' + escapeHtml(tag) + '</button>'; }).join('') + '</div>' : '') + '</div>' +
      (images.length ? '<div id="photoGrid" class="passport-photo-grid">' + images.map(renderPhoto).join('') + '</div>' : empty('No photographs yet', 'CGM and your household can add private photos here as the garden record grows.')) +
      '</section>' + renderPhotoUpload() + renderAreaIndex(areas);
    bindPhotoActions();
  }

  function renderComparison(pair) {
    return '<section class="passport-section photo-comparison-section"><header><div><span class="eyebrow">Then and now</span><h2>Private progress comparison</h2><p>Drag the handle to compare two photographs that CGM deliberately paired for the same garden area.</p></div><span class="comparison-area">' + escapeHtml(pair.key) + '</span></header><div class="before-after-compare" data-comparison><img src="' + escapeHtml(pair.before.url) + '" alt="Earlier: ' + escapeHtml(pair.before.caption || pair.before.filename) + '"><div class="compare-after" data-comparison-after><img src="' + escapeHtml(pair.after.url) + '" alt="Latest: ' + escapeHtml(pair.after.caption || pair.after.filename) + '"></div><span class="compare-label before">Earlier</span><span class="compare-label after">Latest</span><input aria-label="Compare earlier and latest photograph" type="range" min="0" max="100" value="50" data-comparison-range></div></section>';
  }

  function comparisonPair(images) {
    var groups = new Map();
    images.filter(function (image) { return image.comparisonKey; }).forEach(function (image) {
      var group = groups.get(image.comparisonKey) || [];
      group.push(image); groups.set(image.comparisonKey, group);
    });
    var result = null;
    groups.forEach(function (group, key) {
      if (result || group.length < 2) return;
      group.sort(function (a, b) { return String(a.takenAt || a.createdAt).localeCompare(String(b.takenAt || b.createdAt)); });
      result = { key: key, before: group[0], after: group[group.length - 1] };
    });
    return result;
  }

  function renderPhoto(image) {
    var tags = (image.tags || []).map(function (tag) { return '<small>' + escapeHtml(tag) + '</small>'; }).join('');
    return '<button class="passport-photo-card" type="button" data-photo-card data-category="' + escapeHtml(image.category || 'progress') + '" data-area="' + escapeHtml(image.area || '') + '" data-tags="' + escapeHtml(JSON.stringify(image.tags || [])) + '" data-url="' + escapeHtml(image.url) + '" data-caption="' + escapeHtml(image.caption || image.filename) + '"><img src="' + escapeHtml(image.url) + '" alt="' + escapeHtml(image.caption || image.filename) + '" loading="lazy"><span class="photo-card-overlay"><strong>' + escapeHtml(image.caption || image.filename) + '</strong><em>' + escapeHtml(image.area || categoryLabel(image.category)) + '</em>' + (tags ? '<i>' + tags + '</i>' : '') + '</span></button>';
  }

  function renderPhotoUpload() {
    var visits = state.data.visits || [];
    return '<section class="passport-section photo-upload-section"><header><div><span class="eyebrow">Add a private photograph</span><h2>' + (state.context.isAdmin ? 'Record garden progress' : 'Share a photo with CGM') + '</h2><p>Images remain behind the private portal’s authenticated image access.</p></div></header><div id="photoUploadAlert" class="alert" hidden></div><form id="photoUploadForm"><div class="photo-upload-grid"><div class="field field-wide"><label for="photoFiles">Photographs</label><input id="photoFiles" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/avif" multiple required><small>JPG, PNG, WebP, GIF, HEIC or AVIF · maximum 10MB each</small></div><div class="field"><label for="photoCaption">Caption <small>Optional</small></label><input id="photoCaption" maxlength="500" placeholder="e.g. South border after pruning"></div><div class="field"><label for="photoArea">Garden area <small>Optional</small></label><input id="photoArea" maxlength="80" placeholder="e.g. Front border"></div><div class="field"><label for="photoTags">Tags <small>Optional, comma separated</small></label><input id="photoTags" maxlength="300" placeholder="e.g. border, pruning"></div><div class="field"><label for="photoTakenAt">Photo date <small>Optional</small></label><input id="photoTakenAt" type="date"></div>' +
      (state.context.isAdmin ? '<div class="field"><label for="photoCategory">Record type</label><select id="photoCategory"><option value="progress">Progress</option><option value="before_after">Before / after pair</option><option value="reference">Reference</option></select></div><div class="field"><label for="photoVisit">Associated visit <small>Optional</small></label><select id="photoVisit"><option value="">No visit linked</option>' + visits.map(function (visit) { return '<option value="' + visit.id + '">' + escapeHtml(formatDate(visit.scheduledStart, { day: 'numeric', month: 'short', year: 'numeric' })) + '</option>'; }).join('') + '</select></div><div class="field"><label for="photoComparisonKey">Pair key <small>Optional</small></label><input id="photoComparisonKey" maxlength="80" placeholder="Same label on two photos"></div>' : '') +
      '</div><button id="uploadPhotosBtn" class="btn-portal btn-gold" type="submit">Upload private photo' + (state.context.isAdmin ? 's' : '') + '</button></form></section>';
  }

  function renderAreaIndex(areas) {
    if (!areas.length) return '';
    return '<section class="passport-section photo-area-index"><header><div><span class="eyebrow">Garden areas</span><h2>Photo index by area</h2><p>A lightweight index based only on areas CGM records against an image—no property map is displayed or inferred.</p></div></header><div>' + areas.map(function (area) { return '<button type="button" data-photo-area="' + escapeHtml(area) + '"><span>⌘</span>' + escapeHtml(area) + '</button>'; }).join('') + '</div></section>';
  }

  function bindPhotoActions() {
    var activeCategory = 'all'; var activeArea = ''; var activeTag = '';
    function apply() {
      document.querySelectorAll('[data-photo-card]').forEach(function (card) {
        var tags = [];
        try { tags = JSON.parse(card.dataset.tags || '[]'); } catch (_) {}
        card.hidden = (activeCategory !== 'all' && card.dataset.category !== activeCategory) || (activeArea && card.dataset.area !== activeArea) || (activeTag && !tags.includes(activeTag));
      });
    }
    document.querySelectorAll('[data-photo-filter]').forEach(function (button) { button.addEventListener('click', function () { activeCategory = button.dataset.photoFilter; document.querySelectorAll('[data-photo-filter]').forEach(function (item) { item.classList.toggle('is-active', item === button); }); apply(); }); });
    document.querySelectorAll('[data-photo-area]').forEach(function (button) { button.addEventListener('click', function () { activeArea = activeArea === button.dataset.photoArea ? '' : button.dataset.photoArea; document.querySelectorAll('[data-photo-area]').forEach(function (item) { item.classList.toggle('is-active', item.dataset.photoArea === activeArea); }); apply(); }); });
    document.querySelectorAll('[data-photo-tag]').forEach(function (button) { button.addEventListener('click', function () { activeTag = activeTag === button.dataset.photoTag ? '' : button.dataset.photoTag; document.querySelectorAll('[data-photo-tag]').forEach(function (item) { item.classList.toggle('is-active', item.dataset.photoTag === activeTag); }); apply(); }); });
    document.querySelectorAll('[data-photo-card]').forEach(function (button) { button.addEventListener('click', function () { openLightbox(button.dataset.url, button.dataset.caption); }); });
    var range = document.querySelector('[data-comparison-range]');
    if (range) range.addEventListener('input', function () { var layer = document.querySelector('[data-comparison-after]'); layer.style.clipPath = 'inset(0 ' + (100 - Number(range.value)) + '% 0 0)'; });
    var form = $('photoUploadForm');
    if (form) form.addEventListener('submit', uploadPhotos);
  }

  async function uploadPhotos(event) {
    event.preventDefault();
    var files = Array.from($('photoFiles').files || []);
    if (!files.length) return;
    var button = $('uploadPhotosBtn'); var alert = $('photoUploadAlert');
    button.disabled = true; button.textContent = 'Uploading…'; alert.hidden = true;
    var failures = 0;
    try {
      for (var index = 0; index < files.length; index += 1) {
        var form = new FormData();
        form.append('file', files[index]);
        form.append('caption', $('photoCaption').value);
        form.append('area', $('photoArea').value);
        form.append('tags', JSON.stringify($('photoTags').value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean)));
        form.append('takenAt', $('photoTakenAt').value);
        if (state.context.isAdmin) {
          form.append('clientId', state.context.clientId);
          form.append('category', $('photoCategory').value);
          form.append('visitId', $('photoVisit').value);
          form.append('comparisonKey', $('photoComparisonKey').value);
        }
        var response = await fetch('/api/client-image', { method: 'POST', credentials: 'include', body: form });
        var result = await response.json();
        if (!response.ok || !result.ok) failures += 1;
      }
      if (failures) throw new Error(failures + ' photo' + (failures === 1 ? '' : 's') + ' could not be uploaded.');
      await refreshPage();
    } catch (error) { alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = error.message || 'Unable to upload photo.'; button.disabled = false; button.textContent = 'Upload private photos'; }
  }

  /* ------------------------------------------------------------------------ */
  /* Messages                                                                  */
  /* ------------------------------------------------------------------------ */
  async function renderMessages() {
    var body = $('pageBody');
    body.innerHTML = '<section class="passport-section"><div class="portal-loading"><div class="loading-dots"><span></span><span></span><span></span></div><p>Loading private conversation…</p></div></section>';
    var thread = await fetchMessages();
    var messages = thread.messages || [];
    var visits = (state.data.visits || []).filter(function (visit) { return !['cancelled'].includes(visit.status); });
    body.innerHTML = '<div class="message-page-grid"><section class="passport-section message-thread-section"><header><div><span class="eyebrow">Private conversation</span><h2>Messages with CGM <span class="count-pill">' + messages.length + '</span></h2><p>Messages are recorded in this household’s private portal. Opening this page marks messages from the other party as read.</p></div></header><div id="messageList" class="passport-message-list">' + (messages.length ? messages.map(renderMessage).join('') : empty('Start the conversation', 'Ask CGM a question or share a practical note about your garden.')) + '</div></section><aside class="passport-section message-compose-section"><header><div><span class="eyebrow">Write to CGM</span><h2>' + (state.context.isAdmin ? 'Reply as CGM' : 'Send a message') + '</h2><p>Use the quick prompts or write your own message.</p></div></header><div id="messageAlert" class="alert" hidden></div><div class="message-quick-replies"><button type="button" data-quick-message="I have a question about the garden plan.">Garden plan question</button><button type="button" data-quick-message="Could we discuss the next visit?">Next visit</button><button type="button" data-quick-message="I have attached a garden photo for you.">Photo update</button></div><div class="field"><label for="messageBody">Message</label><textarea id="messageBody" maxlength="8000" rows="7" placeholder="Write a private message…"></textarea><small><span id="messageCount">0</span> / 8000</small></div><div class="field"><label for="messageVisit">Link to a visit <small>Optional</small></label><select id="messageVisit"><option value="">General message</option>' + visits.map(function (visit) { return '<option value="' + visit.id + '">' + escapeHtml(formatDate(visit.scheduledStart, { day: 'numeric', month: 'short', year: 'numeric' })) + '</option>'; }).join('') + '</select></div><div class="field"><label for="messagePhoto">Attach a photo <small>Optional · 10MB maximum</small></label><input id="messagePhoto" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/avif"><small id="messagePhotoName"></small></div><button id="sendMessageBtn" type="button" class="btn-portal btn-primary">Send private message</button></aside></div>';
    bindMessageActions();
    scrollMessagesToEnd();
  }

  async function fetchMessages() {
    var response = await fetch('/api/client-messages' + clientQuery(), { credentials: 'include' });
    var result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load messages.');
    return result;
  }

  function renderMessage(message) {
    var own = state.context.isAdmin ? message.senderType === 'admin' : message.senderType === 'client';
    var receipt = own ? (message.recipientReadAt ? 'Read ' + formatRelative(message.recipientReadAt) : 'Delivered to portal') : '';
    var link = message.visit ? '<a href="/portal/history/' + clientQuery() + '" class="message-context-link">Linked visit · ' + escapeHtml(formatDate(message.visit.scheduledStart, { day: 'numeric', month: 'short' })) + '</a>' : message.invoice ? '<a href="/portal/invoices/' + clientQuery() + '" class="message-context-link">Invoice · ' + escapeHtml(message.invoice.invoiceNumber || '') + '</a>' : '';
    var attachment = message.attachment ? '<button type="button" class="message-photo-attachment" data-message-photo data-url="' + escapeHtml(message.attachment.url) + '" data-caption="' + escapeHtml(message.attachment.caption || message.attachment.filename || 'Message attachment') + '"><img src="' + escapeHtml(message.attachment.url) + '" alt="' + escapeHtml(message.attachment.caption || message.attachment.filename || 'Message attachment') + '"><span>View attached photo</span></button>' : '';
    return '<article class="passport-message ' + (own ? 'is-own' : 'is-received') + '"><div class="message-avatar">' + (message.senderType === 'admin' ? 'CGM' : 'You') + '</div><div class="message-bubble"><header><strong>' + escapeHtml(own ? (state.context.isAdmin ? 'Chiltern Garden Maintenance' : 'You') : message.senderName) + '</strong><time>' + escapeHtml(formatRelative(message.createdAt)) + '</time></header><p>' + nl2br(message.body) + '</p>' + attachment + link + '<footer>' + escapeHtml(receipt) + '</footer></div></article>';
  }

  function bindMessageActions() {
    var input = $('messageBody');
    input.addEventListener('input', function () { $('messageCount').textContent = input.value.length; });
    document.querySelectorAll('[data-quick-message]').forEach(function (button) { button.addEventListener('click', function () { input.value = button.dataset.quickMessage; input.focus(); $('messageCount').textContent = input.value.length; }); });
    $('messagePhoto').addEventListener('change', function () { $('messagePhotoName').textContent = this.files?.[0]?.name || ''; });
    $('sendMessageBtn').addEventListener('click', sendMessage);
    document.querySelectorAll('[data-message-photo]').forEach(function (button) { button.addEventListener('click', function () { openLightbox(button.dataset.url, button.dataset.caption); }); });
  }

  async function sendMessage() {
    var button = $('sendMessageBtn'); var alert = $('messageAlert'); var file = $('messagePhoto').files[0]; var attachmentImageId = null;
    var message = $('messageBody').value.trim();
    if (!message && !file) return;
    button.disabled = true; button.textContent = file ? 'Uploading photo…' : 'Sending…'; alert.hidden = true;
    try {
      if (file) attachmentImageId = await uploadMessagePhoto(file);
      button.textContent = 'Sending…';
      var result = await postJson('/api/client-messages', { clientId: state.context.isAdmin ? state.context.clientId : undefined, body: message, visitId: $('messageVisit').value, attachmentImageId: attachmentImageId });
      if (!result.ok) throw new Error(result.error || 'Unable to send message.');
      await renderMessages();
    } catch (error) { alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = error.message || 'Unable to send message.'; button.disabled = false; button.textContent = 'Send private message'; }
  }

  async function uploadMessagePhoto(file) {
    var form = new FormData();
    form.append('file', file); form.append('caption', 'Message attachment'); form.append('tags', JSON.stringify(['message']));
    if (state.context.isAdmin) form.append('clientId', state.context.clientId);
    var response = await fetch('/api/client-image', { method: 'POST', credentials: 'include', body: form });
    var result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to upload attached photo.');
    return result.image.id;
  }

  function scrollMessagesToEnd() {
    var list = $('messageList');
    if (list) list.scrollTop = list.scrollHeight;
  }

  /* ------------------------------------------------------------------------ */
  /* Account                                                                   */
  /* ------------------------------------------------------------------------ */
  function renderAccount() {
    var client = state.data.client;
    var body = $('pageBody');
    body.innerHTML = '<div class="account-grid passport-account-grid"><section class="passport-section"><header><div><span class="eyebrow">Household profile</span><h2>Your private record</h2></div></header><dl class="profile-list"><div><dt>Household</dt><dd>' + escapeHtml(client.householdName) + '</dd></div><div><dt>Username</dt><dd>@' + escapeHtml(client.username) + '</dd></div><div><dt>Email</dt><dd>' + escapeHtml(client.email) + '</dd></div><div><dt>Service area</dt><dd>' + escapeHtml(client.serviceArea || '—') + '</dd></div></dl><p class="section-intro">Need to change household details? <a href="/contact/">Contact CGM</a>.</p></section>' +
      (state.context.isAdmin ? '<section class="passport-section"><header><div><span class="eyebrow">Staff view</span><h2>Account controls</h2></div></header><p class="section-intro">This is a read-only view of the selected household. Use the staff dashboard to change client access or household details.</p><a class="btn-portal btn-primary" href="/portal/admin/dashboard/">Open staff dashboard</a></section>' : renderPasswordPanel()) + '</div>';
    if (!state.context.isAdmin) $('passwordForm').addEventListener('submit', changePassword);
  }

  function renderPasswordPanel() {
    return '<section class="passport-section"><header><div><span class="eyebrow">Security</span><h2>Change password</h2><p>Use a memorable passphrase of at least 12 characters. Changing it signs out other devices.</p></div></header><div id="accountAlert" class="alert" hidden></div><form id="passwordForm"><div class="field"><label for="currentPassword">Current password</label><input type="password" id="currentPassword" autocomplete="current-password" required></div><div class="field"><label for="newPassword">New password</label><input type="password" id="newPassword" autocomplete="new-password" minlength="12" required></div><div class="field"><label for="confirmPassword">Confirm new password</label><input type="password" id="confirmPassword" autocomplete="new-password" minlength="12" required></div><button class="btn-portal btn-primary" type="submit" id="passwordSubmit">Update password</button></form></section>';
  }

  async function changePassword(event) {
    event.preventDefault();
    var alert = $('accountAlert'); var button = $('passwordSubmit');
    var currentPassword = $('currentPassword').value; var newPassword = $('newPassword').value; var confirmPassword = $('confirmPassword').value;
    if (newPassword !== confirmPassword) { alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = 'New passwords do not match.'; return; }
    button.disabled = true; button.textContent = 'Updating…';
    try {
      var result = await postJson('/api/auth-password-change', { currentPassword: currentPassword, newPassword: newPassword });
      if (!result.ok) throw new Error(result.error || 'Unable to update password.');
      $('passwordForm').reset(); alert.hidden = false; alert.className = 'alert alert-success'; alert.textContent = result.message || 'Password updated.';
    } catch (error) { alert.hidden = false; alert.className = 'alert alert-error'; alert.textContent = error.message || 'Unable to update password.'; }
    button.disabled = false; button.textContent = 'Update password';
  }

  /* ------------------------------------------------------------------------ */
  /* Shared browser helpers                                                    */
  /* ------------------------------------------------------------------------ */
  function selectOptions(values, selected) {
    return values.map(function (value) { return '<option value="' + value + '"' + (value === selected ? ' selected' : '') + '>' + escapeHtml(value.replace(/_/g, ' ')) + '</option>'; }).join('');
  }

  async function postJson(url, payload, method) {
    var response = await fetch(url, { method: method || 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    var result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  }

  function openModal(title, body, footer, onReady) {
    var modal = document.createElement('div');
    modal.className = 'modal-backdrop passport-modal-backdrop';
    modal.innerHTML = '<div class="modal passport-modal" role="dialog" aria-modal="true" aria-labelledby="passportModalTitle"><div class="modal-head"><h3 id="passportModalTitle">' + escapeHtml(title) + '</h3><button type="button" class="modal-close" data-close-modal aria-label="Close">×</button></div><div class="modal-body"><div class="alert alert-error" data-modal-alert hidden></div>' + body + '</div><div class="modal-foot">' + footer + '</div></div>';
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-modal]').forEach(function (button) { button.addEventListener('click', function () { modal.remove(); }); });
    modal.addEventListener('click', function (event) { if (event.target === modal) modal.remove(); });
    if (onReady) onReady(modal);
  }

  function modalAlert(modal, message) { var alert = modal.querySelector('[data-modal-alert]'); alert.hidden = false; alert.textContent = message; }

  function openLightbox(url, caption) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = '<button class="lb-close" type="button" aria-label="Close photograph">×</button><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(caption) + '"><p>' + escapeHtml(caption) + '</p>';
    overlay.addEventListener('click', function () { overlay.remove(); document.body.style.overflow = ''; });
    document.body.appendChild(overlay); document.body.style.overflow = 'hidden';
  }

  function empty(title, copy) { return '<div class="passport-empty"><span>✦</span><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p></div>'; }
  function nl2br(value) { return escapeHtml(value).replace(/\n/g, '<br>'); }
  function unique(values) { return Array.from(new Set(values)); }
  function categoryLabel(category) { return { progress: 'Progress', before_after: 'Before / after', reference: 'Reference', client_upload: 'Your upload' }[category] || 'Garden photo'; }
}());
