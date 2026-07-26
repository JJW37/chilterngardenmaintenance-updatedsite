// CGM Editorial Enhancements v2.5 (2026-07-18)
// Universal script for all editorial-upgraded pages.
// Handles: mobile bottom action bar (cookie-gated), footer accordion,
// swipe row (mobile), hide contact-float on mobile.
// Safe to load on any page - exits early if elements aren't present.
(function() {
  var CONSENT_KEY = 'cgm_cookie_consent';
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  // ---- Mobile bottom action bar: only show after cookie consent resolved ----
  var bottomBar = document.getElementById('bottomActionBar');
  if (bottomBar && isMobile) {
    function maybeShowBottomBar() {
      var consent = getConsent();
      if (consent === 'accepted' || consent === 'rejected') {
        bottomBar.classList.add('is-visible');
        document.body.classList.add('has-bottom-action-bar');
      } else {
        bottomBar.classList.remove('is-visible');
        document.body.classList.remove('has-bottom-action-bar');
      }
    }
    window.addEventListener('cookieConsentChanged', maybeShowBottomBar);
    maybeShowBottomBar();
    setTimeout(maybeShowBottomBar, 2000);
  }

  // ---- Footer accordion (mobile only) ----
  var footerAcc = document.querySelector('.footer-grid.footer-accordion');
  if (footerAcc && isMobile) {
    var columns = footerAcc.querySelectorAll(':scope > div');
    columns.forEach(function(col) {
      var h3 = col.querySelector(':scope > h3');
      if (!h3) return;
      h3.setAttribute('role', 'button');
      h3.setAttribute('tabindex', '0');
      h3.setAttribute('aria-expanded', 'false');
      h3.addEventListener('click', function() {
        var isOpen = col.classList.toggle('is-open');
        h3.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      h3.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          h3.click();
        }
      });
    });
  }

  // ---- Hide contact-float on mobile (replaced by bottom bar) ----
  if (isMobile) {
    var cf = document.querySelector('.contact-float');
    if (cf) cf.style.display = 'none';
  }
})();
