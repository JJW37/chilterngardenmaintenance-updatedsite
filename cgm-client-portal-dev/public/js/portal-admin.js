/**
 * CGM Client Portal - Admin dashboard JS
 * Powers /portal/admin/dashboard/
 */

(function() {
  'use strict';

  var state = {
    authenticated: false,
    isAdmin: false,
    clients: [],
    filteredClients: [],
  };

  var $ = function(id) { return document.getElementById(id); };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    $('year') && ($('year').textContent = new Date().getFullYear());
    bindModalSafety();

    try {
      var res = await fetch('/api/auth-session', { credentials: 'include' });
      var session = await res.json();
      if (!session.authenticated || !session.isAdmin) {
        closeModal();
        showNotAuth();
        return;
      }
      state.authenticated = true;
      state.isAdmin = true;
      await loadClients();
      bindEvents();
      $('loadingState').hidden = true;
      $('dashboard').hidden = false;
    } catch (err) {
      console.error('[admin] init failed:', err);
      showNotAuth();
    }
  }

  function showNotAuth() {
    $('loadingState').hidden = true;
    $('notAuthState').hidden = false;
  }

  async function loadClients() {
    var res = await fetch('/api/admin-clients', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load clients');
    var data = await res.json();
    state.clients = data.clients || [];
    applyFilter();
  }

  function applyFilter() {
    var q = ($('searchInput').value || '').trim().toLowerCase();
    var activeOnly = $('activeOnlyChk').checked;
    state.filteredClients = state.clients.filter(function(c) {
      if (activeOnly && !c.isActive) return false;
      if (!q) return true;
      return (
        (c.householdName || '').toLowerCase().indexOf(q) !== -1 ||
        (c.username || '').toLowerCase().indexOf(q) !== -1 ||
        (c.email || '').toLowerCase().indexOf(q) !== -1 ||
        (c.addressLine || '').toLowerCase().indexOf(q) !== -1 ||
        (c.serviceArea || '').toLowerCase().indexOf(q) !== -1
      );
    });
    renderClientList();
  }

  function renderClientList() {
    var list = $('clientList');
    var total = state.clients.length;
    var active = state.clients.filter(function(c) { return c.isActive; }).length;
    $('summaryLine').textContent = total + ' client' + (total === 1 ? '' : 's') + ' · ' + active + ' active · ' + (total - active) + ' inactive';

    if (state.filteredClients.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="es-icon">&#128269;</div><p>No clients match your search. ' + (total === 0 ? 'Click "New client" to add your first.' : '') + '</p></div>';
      return;
    }

    list.innerHTML = state.filteredClients.map(function(c) {
      var cls = ['client-row'];
      if (!c.isActive) cls.push('inactive');
      var lastNote = c.lastNoteAt ? formatRelative(c.lastNoteAt) : 'never';
      return '<div class="' + cls.join(' ') + '" data-id="' + c.id + '">' +
        '<div class="cr-main">' +
          '<div class="cr-name">' + escapeHtml(c.householdName) + '</div>' +
          '<div class="cr-meta">' +
            '<span>@' + escapeHtml(c.username) + '</span>' +
            '<span>&#9993; ' + escapeHtml(c.email) + '</span>' +
            (c.addressLine ? '<span>&#128205; ' + escapeHtml(c.addressLine) + '</span>' : '') +
            (c.serviceArea ? '<span>' + escapeHtml(c.serviceArea) + '</span>' : '') +
          '</div>' +
          '<div class="cr-stats">' +
            '<span><strong>' + c.noteCount + '</strong> notes</span>' +
            '<span><strong>' + c.imageCount + '</strong> images</span>' +
            '<span><strong>' + (c.upcomingVisitCount || 0) + '</strong> upcoming visits</span>' +
            (c.unreadMessageCount ? '<span class="admin-unread-message"><strong>' + c.unreadMessageCount + '</strong> unread message' + (c.unreadMessageCount === 1 ? '' : 's') + '</span>' : '') +
            '<span>Last activity: <strong>' + lastNote + '</strong></span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:.4rem;align-items:flex-end;">' +
          '<a class="btn-portal btn-primary" href="/portal/?clientId=' + c.id + '" data-action="open">Open portal</a>' +
          '<div style="display:flex;gap:.4rem;">' +
            '<a class="btn-portal btn-ghost" href="/portal/messages/?clientId=' + c.id + '" title="Open the private message thread">Messages' + (c.unreadMessageCount ? ' (' + c.unreadMessageCount + ')' : '') + '</a>' +
            '<button class="btn-portal btn-ghost" data-action="login-link" title="Send a secure password-reset link by email">Send reset link</button>' +
            '<button class="btn-portal btn-ghost" data-action="copy-link" title="Copy the portal sign-in URL">Copy login URL</button>' +
            '<button class="btn-portal btn-ghost" data-action="edit">Edit</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function bindEvents() {
    $('logoutBtn').addEventListener('click', logout);
    $('searchInput').addEventListener('input', applyFilter);
    $('clearSearchBtn').addEventListener('click', function() {
      $('searchInput').value = '';
      $('activeOnlyChk').checked = false;
      applyFilter();
    });
    $('activeOnlyChk').addEventListener('change', applyFilter);

    $('newClientBtn').addEventListener('click', function() { openModal(null); });

    $('modalSave').addEventListener('click', saveClient);

    // Client list actions (event delegation)
    $('clientList').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var row = btn.closest('.client-row');
      if (!row) return;
      var clientId = parseInt(row.dataset.id, 10);
      var action = btn.dataset.action;
      var client = state.clients.find(function(c) { return c.id === clientId; });
      if (!client) return;

      if (action === 'edit') {
        openModal(client);
      } else if (action === 'login-link') {
        sendLoginLink(client);
      } else if (action === 'copy-link') {
        copyLoginUrl(client);
      }
      // 'open' is a real <a href> - default behavior is fine.
    });
  }

  async function logout() {
    try {
      await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    window.location.href = '/portal/admin/';
  }

  // ---------- Modal ----------
  function openModal(client) {
    var modal = $('clientModal');
    var title = $('modalTitle');
    var form = $('clientForm');
    form.reset();
    $('modalAlert').hidden = true;
    $('modalAlert').textContent = '';

    if (client) {
      title.textContent = 'Edit client';
      $('cf_id').value = client.id;
      $('cf_username').value = client.username;
      $('cf_username').disabled = true;
      $('cf_household').value = client.householdName;
      $('cf_email').value = client.email;
      $('cf_address').value = client.addressLine || '';
      $('cf_area').value = client.serviceArea || '';
      $('cf_internal').value = client.notesInternal || '';
      $('cf_active').checked = client.isActive;
      $('cf_password').required = false;
      $('cf_password_required').hidden = true;
      $('cf_password_help').textContent = 'Leave blank to keep the current password. Enter a new 12+ character password to reset it and sign the household out on other devices.';
    } else {
      title.textContent = 'New client';
      $('cf_id').value = '';
      $('cf_username').disabled = false;
      $('cf_password').required = true;
      $('cf_password_required').hidden = false;
      $('cf_password_help').textContent = 'Set a 12+ character password to activate this household. You will not be able to view it again.';
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    var modal = $('clientModal');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  function bindModalSafety() {
    var modal = $('clientModal');
    if (!modal || modal.dataset.closeBound === 'true') return;
    modal.dataset.closeBound = 'true';
    $('modalClose').addEventListener('click', closeModal);
    $('modalCancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function(event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  async function saveClient() {
    var id = $('cf_id').value;
    var username = $('cf_username').value.trim().toLowerCase();
    var householdName = $('cf_household').value.trim();
    var email = $('cf_email').value.trim().toLowerCase();
    var addressLine = $('cf_address').value.trim();
    var serviceArea = $('cf_area').value.trim();
    var notesInternal = $('cf_internal').value.trim();
    var isActive = $('cf_active').checked;
    var password = $('cf_password').value;

    if (!householdName || !email) {
      showModalAlert('Household name and email are required.', 'error');
      return;
    }
    if (!id && !username) {
      showModalAlert('Username is required for new clients.', 'error');
      return;
    }
    if (!id && password.length < 12) {
      showModalAlert('Set an initial password of at least 12 characters.', 'error');
      return;
    }

    var btn = $('modalSave');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      var res, data;
      if (id) {
        // Update existing
        res = await fetch('/api/admin-client', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: parseInt(id, 10),
            householdName: householdName,
            email: email,
            addressLine: addressLine,
            serviceArea: serviceArea,
            notesInternal: notesInternal,
            isActive: isActive,
            newPassword: password,
          }),
        });
      } else {
        // Create new
        res = await fetch('/api/admin-client-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: username,
            householdName: householdName,
            email: email,
            addressLine: addressLine,
            serviceArea: serviceArea,
            notesInternal: notesInternal,
            initialPassword: password,
            isActive: isActive,
          }),
        });
      }
      data = await res.json();
      if (data.ok) {
        closeModal();
        await loadClients();
      } else if (res.status === 401 || res.status === 403 || data.error === 'forbidden') {
        closeModal();
        window.location.href = '/portal/admin/?expired=1';
      } else {
        showModalAlert(data.error || 'Failed to save client.', 'error');
      }
    } catch (e) {
      showModalAlert('Network error. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save client';
    }
  }

  function showModalAlert(msg, type) {
    var a = $('modalAlert');
    a.hidden = false;
    a.className = 'alert alert-' + (type || 'info');
    a.textContent = msg;
  }

  // ---------- Recovery and login actions ----------
  async function sendLoginLink(client) {
    if (!confirm('Send a secure password-reset link to ' + client.email + ' for ' + client.householdName + '?')) return;
    try {
      var res = await fetch('/api/auth-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: client.username }),
      });
      var data = await res.json();
      if (data.ok) {
        alert('Secure reset link sent to ' + client.email + '. The client can open it and set a new password from Account & security.');
      } else {
        alert(data.error || 'Failed to send login link.');
      }
    } catch (e) {
      alert('Network error.');
    }
  }

  async function copyLoginUrl(client) {
    var url = window.location.origin + '/login/?username=' + encodeURIComponent(client.username);
    try {
      await navigator.clipboard.writeText(url);
      alert('Login URL copied to clipboard:\n\n' + url + '\n\nPaste this in an invitation. The client will still need the password you set for their household.');
    } catch (e) {
      // Fallback
      window.prompt('Copy this URL:', url);
    }
  }

  // ---------- Helpers ----------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatRelative(s) {
    if (!s) return 'never';
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    var diff = Date.now() - d.getTime();
    var sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + 'm ago';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    var day = Math.floor(hr / 24);
    if (day < 30) return day + 'd ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
})();
