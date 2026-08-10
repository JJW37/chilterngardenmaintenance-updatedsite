/* Shared client-portal helpers for the focused household pages. */
(function () {
  'use strict';

  var ADMIN_CLIENT_STORAGE_KEY = 'cgm-admin-client-id';
  var PUBLIC_SITE_ORIGIN = 'https://jjw37.github.io/chilterngardenmaintenance-updatedsite';

  function validClientId(value) {
    var id = Number.parseInt(value || '0', 10);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  function selectedAdminClientId() {
    try { return validClientId(window.sessionStorage.getItem(ADMIN_CLIENT_STORAGE_KEY)); } catch (_) { return null; }
  }

  function rememberAdminClient(id) {
    var validId = validClientId(id);
    if (!validId) return null;
    try { window.sessionStorage.setItem(ADMIN_CLIENT_STORAGE_KEY, String(validId)); } catch (_) {}
    return validId;
  }

  function publicSiteUrl(path) {
    var cleanPath = String(path || '').replace(/^\/+/, '');
    return PUBLIC_SITE_ORIGIN + '/' + cleanPath;
  }

  function configurePublicWebsiteNavigation() {
    var header = document.querySelector('.header .nav');
    if (!header) return;

    var brand = header.querySelector('.brand');
    if (brand) {
      brand.href = publicSiteUrl('');
      brand.removeAttribute('aria-current');
    }

    // The portal is hosted separately for secure server-side functions. Keep
    // every public-site link pointed at the public CGM website, rather than at
    // an empty matching path on the portal host.
    var publicPaths = {
      'Services': 'services/',
      'Portfolio': 'portfolio/',
      'Garden Knowledge': 'tips/',
      'Locations': 'locations/',
      'The CGM Method': 'about/maintenance.html',
      'Get a Quote': 'booking/'
    };
    header.querySelectorAll('.nav-links a').forEach(function (link) {
      var path = publicPaths[(link.textContent || '').trim()];
      if (path) link.href = publicSiteUrl(path);
    });

    var actions = header.querySelector('.nav-cta');
    if (actions && !actions.querySelector('.cgm-site-return')) {
      var returnLink = document.createElement('a');
      returnLink.className = 'btn-portal btn-ghost cgm-site-return';
      returnLink.href = publicSiteUrl('');
      returnLink.textContent = '← CGM website';
      returnLink.setAttribute('aria-label', 'Return to the Chiltern Garden Maintenance website');
      actions.insertBefore(returnLink, actions.firstChild);
    }
  }

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
    var requestedId = validClientId(query.get('clientId'));
    // Staff can move between the Garden Passport tabs without each link
    // having to carry an id forever. Keep only the current household id in
    // this browser tab; it is never used as an authorisation mechanism.
    if (session.isAdmin && requestedId) rememberAdminClient(requestedId);
    var savedId = session.isAdmin && !requestedId ? selectedAdminClientId() : null;
    var clientId = session.isAdmin ? (requestedId || savedId) : session.client && session.client.id;
    if (session.isAdmin && !clientId) {
      return { session: session, clientId: null, isAdmin: true, needsClientSelection: true };
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
    configurePublicWebsiteNavigation();
    var nav = document.getElementById('portalNav');
    if (nav) {
      nav.querySelectorAll('[data-portal-path]').forEach(function (link) {
        var path = link.getAttribute('data-portal-path');
        link.href = path + clientQuery(context);
        // Keep the selected household even if a browser, cache extension or
        // copied link removes the query string during a later navigation.
        link.addEventListener('click', function () {
          if (context && context.isAdmin) rememberAdminClient(context.clientId);
        });
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

  function showClientSelection() {
    var loading = document.getElementById('loadingState');
    var unauthorised = document.getElementById('notAuthState');
    var content = document.getElementById('portalContent');
    if (loading) loading.hidden = true;
    if (unauthorised) {
      unauthorised.hidden = false;
      unauthorised.innerHTML = '<h1>Select a household</h1><p>Choose a household from the staff dashboard before opening its Garden Passport.</p><a class="btn-portal btn-primary" href="/portal/admin/dashboard/">Open staff dashboard</a>';
    }
    if (content) content.hidden = true;
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
    configurePublicWebsiteNavigation: configurePublicWebsiteNavigation,
    getContext: getContext,
    getData: getData,
    setupNavigation: setupNavigation,
    showClientSelection: showClientSelection,
    showPageState: showPageState,
    rememberAdminClient: rememberAdminClient,
  };
}());
