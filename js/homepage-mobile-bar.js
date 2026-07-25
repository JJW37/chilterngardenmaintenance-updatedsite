/* Homepage mobile bottom action bar + footer accordion.
   Extracted from index.html for caching. */
  // ---- Editorial homepage enhancements (v2.4) ----
  (function() {
    var CONSENT_KEY = 'cgm_cookie_consent';
    var isMobile = window.matchMedia('(max-width: 768px)').matches;

    // ---- Mobile bottom action bar: only show after cookie consent resolved ----
    var bottomBar = document.getElementById('bottomActionBar');
    var cookieBanner = document.getElementById('cookie-banner');

    function getConsent() {
      try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
    }

    function maybeShowBottomBar() {
      if (!bottomBar) return;
      if (!isMobile) return; // desktop doesn't use the bar
      var consent = getConsent();
      // consent === 'accepted' || consent === 'rejected' → resolved
      // null → banner still showing → don't show bar yet
      if (consent === 'accepted' || consent === 'rejected') {
        bottomBar.classList.add('is-visible');
        document.body.classList.add('has-bottom-action-bar');
      } else {
        bottomBar.classList.remove('is-visible');
        document.body.classList.remove('has-bottom-action-bar');
      }
    }

    // Listen for consent changes (main.js dispatches cookieConsentChanged)
    window.addEventListener('cookieConsentChanged', maybeShowBottomBar);
    // Also check on load and after a short delay (in case banner is auto-dismissed)
    maybeShowBottomBar();
    setTimeout(maybeShowBottomBar, 2000);

    // ---- Footer accordion (mobile only) ----
    var footerAcc = document.querySelector('.footer-grid.footer-accordion');
    if (footerAcc && isMobile) {
      // Wrap each non-brand column's h3 in a button for toggle, OR just make h3 clickable
      var columns = footerAcc.querySelectorAll(':scope > div');
      columns.forEach(function(col) {
        // Skip brand column (no h3)
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
