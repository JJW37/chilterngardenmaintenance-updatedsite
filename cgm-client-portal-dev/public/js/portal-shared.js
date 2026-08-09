/* Shared client-portal helpers for the focused household pages. */
(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value, options) {
    if (!value) return '—';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatRelative(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    var seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hr ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    return formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function getContext() {
    var response = await fetch('/api/auth-session', { credentials: 'include' });
    var session = await response.json();
    if (!session.authenticated) return null;
    var query = new URLSearchParams(window.location.search);
    var requestedId = Number.parseInt(query.get('clientId') || '0', 10);
    var clientId = session.isAdmin ? requestedId : session.client && session.client.id;
    if (session.isAdmin && !clientId) {
      window.location.replace('/portal/admin/dashboard/');
      return null;
    }
    return { session: session, clientId: clientId, isAdmin: session.isAdmin === true };
  }

  async function getData(context) {
    var suffix = context.isAdmin ? '?clientId=' + encodeURIComponent(context.clientId) : '';
    var response = await fetch('/api/client-data' + suffix, { credentials: 'include' });
    if (!response.ok) throw new Error('Unable to load your private portal.');
    return response.json();
  }

  function clientQuery(context) {
    return context && context.isAdmin ? '?clientId=' + encodeURIComponent(context.clientId) : '';
  }

  function setupNavigation(context, active) {
    var nav = document.getElementById('portalNav');
    if (nav) {
      nav.querySelectorAll('[data-portal-path]').forEach(function (link) {
        var path = link.getAttribute('data-portal-path');
        link.href = path + clientQuery(context);
        if (link.getAttribute('data-portal-key') === active) link.setAttribute('aria-current', 'page');
      });
    }
    var adminBanner = document.getElementById('adminBanner');
    if (adminBanner && context && context.isAdmin) adminBanner.hidden = false;
    var signOut = document.getElementById('logoutBtn');
    if (signOut) {
      signOut.addEventListener('click', async function () {
        try { await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' }); } catch (_) {}
        window.location.assign('/login/');
      });
    }
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  function showPageState(mode) {
    var loading = document.getElementById('loadingState');
    var unauthorised = document.getElementById('notAuthState');
    var content = document.getElementById('portalContent');
    if (loading) loading.hidden = mode !== 'loading';
    if (unauthorised) unauthorised.hidden = mode !== 'unauthorised';
    if (content) content.hidden = mode !== 'content';
  }

  window.CGMPortal = {
    clientQuery: clientQuery,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatRelative: formatRelative,
    getContext: getContext,
    getData: getData,
    setupNavigation: setupNavigation,
    showPageState: showPageState,
  };
}());
