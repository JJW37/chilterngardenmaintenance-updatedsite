/* Chiltern Garden Maintenance - main.js (v3)
   Handles: mobile nav toggle (native click, Safari-safe),
   cookie consent, smooth scroll, contact-float widget.
*/
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // ---- Mobile navigation (Safari-safe native click) ----
  var menuToggle = document.getElementById("mobileMenuToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  if (!menuToggle || !mobileMenu) {
    console.error("CGM mobile navigation elements were not found.");
  } else {
    var setMenuState = function (isOpen) {
      mobileMenu.hidden = !isOpen;
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
      document.documentElement.classList.toggle("mobile-menu-open", isOpen);
    };

    menuToggle.addEventListener("click", function (event) {
      event.preventDefault();
      var isCurrentlyOpen =
        menuToggle.getAttribute("aria-expanded") === "true";
      setMenuState(!isCurrentlyOpen);
    });

    // Close menu when a link is tapped
    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMenuState(false);
      }
    });

    // Close on Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuState(false);
        menuToggle.focus();
      }
    });
  }

  // ---- Garden Knowledge collapsible section in mobile menu ----
  var gkToggle = document.querySelector(".mobile-gk-toggle");
  var gkItems = document.getElementById("mobileGK");

  if (gkToggle && gkItems) {
    gkToggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var isOpen = gkToggle.getAttribute("aria-expanded") === "true";
      gkItems.hidden = isOpen;
      gkToggle.setAttribute("aria-expanded", String(!isOpen));
      gkToggle.classList.toggle("gk-open", !isOpen);
    });
  }

  // ---- Cookie banner ----
  var banner = document.getElementById("cookie-banner");
  var acceptBtn = document.getElementById("cookie-accept");
  var rejectBtn = document.getElementById("cookie-reject");
  var KEY = "cgm_cookie_consent";
  var stored = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch (e) {}

  if (banner) {
    if (!stored) {
      banner.hidden = false;
    }
    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        try {
          localStorage.setItem(KEY, "accepted");
          localStorage.setItem("cookieConsent", "accepted");
        } catch (e) {}
        banner.hidden = true;
        loadGA();
        window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: "accepted" }));
      });
    }
    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        try {
          localStorage.setItem(KEY, "rejected");
          localStorage.setItem("cookieConsent", "rejected");
        } catch (e) {}
        banner.hidden = true;
        window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: "rejected" }));
      });
    }
  }


  // ---- Google Analytics: load only after consent ----
  var GA_ID = "G-SYLGY77VNE";
  var GA_LOADED = false;

  function loadGA() {
    if (GA_LOADED) return;
    GA_LOADED = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  // If user previously accepted, load GA immediately
  if (stored === "accepted") {
    loadGA();
  }


  // ---- Contact float widget ----
  var contactFloat = document.querySelector("[data-contact-float]");
  var contactToggle = document.querySelector("[data-contact-toggle]");
  var contactPanel = document.querySelector("[data-contact-panel]");
  var contactClose = document.querySelector("[data-contact-close]");

  if (contactFloat && contactToggle && contactPanel) {
    setTimeout(function () {
      contactFloat.hidden = false;
    }, 1500);

    contactToggle.addEventListener("click", function () {
      var isHidden = contactPanel.hidden;
      contactPanel.hidden = !isHidden;
    });

    if (contactClose) {
      contactClose.addEventListener("click", function () {
        contactPanel.hidden = true;
      });
    }

    document.addEventListener("click", function (e) {
      if (!contactFloat.contains(e.target) && !contactPanel.hidden) {
        contactPanel.hidden = true;
      }
    });
  }

  // ---- Smooth-scroll for anchor links ----
  if (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // ---- Back to top button ----
  // Appears bottom-left once the user has scrolled down past 400px,
  // smooth-scrolls to the top of the page when clicked.
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    var toggleBackToTop = function () {
      // Remove the hidden attribute the first time we want to show it,
      // then use the .is-visible class to animate opacity/transform.
      if (window.scrollY > 400) {
        if (backToTop.hidden) {
          backToTop.hidden = false;
          // Force a reflow so the transition runs on the next frame.
          // Without this, the button snaps in without animating.
          void backToTop.offsetWidth;
        }
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    };

    // Use passive listener for performance - we only read scrollY.
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    // Run once on load in case the page was reloaded mid-scroll.
    toggleBackToTop();

    backToTop.addEventListener("click", function () {
      var reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
      // Move focus back to the top of the document for keyboard users.
      document.body.focus({ preventScroll: true });
    });
  }

  // ---- Rotating search suggestions ----
  // Finds every <input> with a data-suggestions attribute (a JSON array of
  // suggestion strings) and cycles the placeholder through them every 3.5
  // seconds. Rotation pauses when the input is focused or has text, and
  // resumes when it's blurred and empty. This gives the search bars a
  // lively, intelligent feel without distracting the user.
  var rotatingInputs = document.querySelectorAll("input[data-suggestions]");
  rotatingInputs.forEach(function (input) {
    var raw = input.getAttribute("data-suggestions");
    var suggestions;
    try {
      suggestions = JSON.parse(raw);
    } catch (e) {
      return; // malformed JSON - skip this input
    }
    if (!suggestions || suggestions.length === 0) return;

    var originalPlaceholder = input.getAttribute("placeholder") || "";
    var index = 0;
    var timer = null;

    function showNext() {
      // Don't rotate if the user is typing or has text in the field
      if (input === document.activeElement || input.value.length > 0) return;
      var suggestion = suggestions[index % suggestions.length];
      input.setAttribute("placeholder", suggestion);
      index++;
    }

    function startRotation() {
      if (timer) return;
      // Show the first suggestion immediately, then rotate every 3.5s
      showNext();
      timer = setInterval(showNext, 3500);
    }

    function stopRotation() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Start rotating on load (after a short delay so the page settles)
    setTimeout(startRotation, 1500);

    // Pause on focus
    input.addEventListener("focus", function () {
      stopRotation();
      // Restore the original placeholder while focused so the user sees
      // the generic prompt, not a rotating suggestion
      input.setAttribute("placeholder", originalPlaceholder);
    });

    // Resume on blur if the field is empty
    input.addEventListener("blur", function () {
      if (input.value.length === 0) {
        startRotation();
      }
    });

    // If the user clears the field (via the clear button or Escape),
    // resume rotation
    input.addEventListener("input", function () {
      if (input.value.length === 0 && input !== document.activeElement) {
        startRotation();
      }
    });
  });

  // ---- Reading progress bar ----
  // Shows on article and plant detail pages. A thin forest-green bar on
  // the left edge of the viewport that fills from 0% at the very top of
  // the page to 100% at the very bottom. Tracks the WHOLE PAGE (not just
  // the article element) so the user sees progress from the very first
  // scroll, making the feature obvious rather than confusing.
  var readingProgress = document.getElementById("readingProgress");
  var readingProgressBar = document.getElementById("readingProgressBar");
  if (readingProgress && readingProgressBar) {
    // Only activate on article pages (.article-body) or plant pages (.plant-hero)
    var articleBody = document.querySelector(".article-body");
    var plantHero = document.querySelector(".plant-hero");
    var contentEl = articleBody || plantHero;

    if (contentEl) {
      // Show the bar immediately on page load so the user sees the feature
      // is there, even before they start scrolling.
      readingProgress.hidden = false;

      function updateProgress() {
        var scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        var docHeight = document.documentElement.scrollHeight;
        var windowHeight = window.innerHeight;
        var scrollable = docHeight - windowHeight;

        if (scrollable <= 0) {
          // Page fits in the viewport without scrolling - show full bar
          readingProgressBar.style.height = "100%";
        } else {
          var pct = Math.max(0, Math.min(100, (scrollY / scrollable) * 100));
          readingProgressBar.style.height = pct + "%";
        }
      }

      window.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);
      updateProgress();
    }
  }

  // ---- Services page: interactive service selector ----
  // Clicking an option on the left updates the right panel to show the
  // recommended starting service + next steps.
  (function() {
    var options = document.querySelectorAll('.svc-selector__option');
    var panels = document.querySelectorAll('.svc-selector__panel');
    if (!options.length || !panels.length) return;

    options.forEach(function(opt) {
      opt.addEventListener('click', function() {
        var id = opt.getAttribute('data-svc-option');
        // Update active states on the buttons
        options.forEach(function(o) { o.classList.remove('is-active'); });
        opt.classList.add('is-active');
        // Show the matching panel, hide others
        panels.forEach(function(p) {
          var panelId = p.getAttribute('data-svc-panel');
          if (panelId === id) {
            p.removeAttribute('hidden');
          } else {
            p.setAttribute('hidden', '');
          }
        });
      });
    });
  })();
});
