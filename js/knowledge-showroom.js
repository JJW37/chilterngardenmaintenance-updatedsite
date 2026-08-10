(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(function () {
    var root = document.querySelector('.knowledge-showroom');
    if (!root) return;
    // These catalogue pages must remain readable even where an
    // IntersectionObserver is unsupported or never returns a callback.
    // The animation is optional; the content is not.
    var canObserve = typeof window.IntersectionObserver === 'function';
    if (canObserve) root.classList.add('knowledge-showroom--enhanced');

    var routeButtons = Array.prototype.slice.call(root.querySelectorAll('[data-knowledge-route]'));
    var routeNumber = root.querySelector('[data-knowledge-route-number]');
    var routeLabel = root.querySelector('[data-knowledge-route-label-output]');
    var routeTitle = root.querySelector('[data-knowledge-route-title-output]');
    var routeCopy = root.querySelector('[data-knowledge-route-copy-output]');
    var routeLink = root.querySelector('[data-knowledge-route-link]');

    function setTabState(buttons, activeButton) {
      buttons.forEach(function (button) {
        var active = button === activeButton;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function scrollToSection(id) {
      var target = document.getElementById(id);
      if (!target) return;
      var siteHeader = document.querySelector('.header');
      var headerHeight = siteHeader ? siteHeader.offsetHeight : 0;
      window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - headerHeight - 6, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      window.setTimeout(function () { target.focus({ preventScroll: true }); }, 520);
    }

    function setRoute(button) {
      if (!button) return;
      var target = button.getAttribute('data-knowledge-target');
      var index = routeButtons.indexOf(button) + 1;
      setTabState(routeButtons, button);
      root.setAttribute('data-knowledge-active-route', target || '');
      if (routeNumber) routeNumber.textContent = String(index).padStart(2, '0');
      if (routeLabel) routeLabel.textContent = button.getAttribute('data-knowledge-route-label') || '';
      if (routeTitle) routeTitle.textContent = button.getAttribute('data-knowledge-route-title') || '';
      if (routeCopy) routeCopy.textContent = button.getAttribute('data-knowledge-route-copy') || '';
      if (routeLink && target) {
        routeLink.href = '#' + target;
        if (routeLink.firstChild) routeLink.firstChild.nodeValue = (root.classList.contains('knowledge-showroom--tips') ? 'Open this reading route ' : 'Open this collection ');
      }
      try { window.sessionStorage.setItem('cgm-knowledge-route-' + (root.classList.contains('knowledge-showroom--plants') ? 'plants' : 'tips'), target || ''); } catch (error) { /* optional memory only */ }
    }

    routeButtons.forEach(function (button, index) {
      button.addEventListener('click', function () { setRoute(button); });
      button.addEventListener('keydown', function (event) {
        var direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        var next = (index + direction + routeButtons.length) % routeButtons.length;
        routeButtons[next].focus();
        setRoute(routeButtons[next]);
      });
    });
    if (routeButtons.length) {
      var savedRoute = null;
      try { savedRoute = window.sessionStorage.getItem('cgm-knowledge-route-' + (root.classList.contains('knowledge-showroom--plants') ? 'plants' : 'tips')); } catch (error) { savedRoute = null; }
      var initial = routeButtons.filter(function (button) { return button.getAttribute('data-knowledge-target') === savedRoute; })[0] || routeButtons[0];
      setRoute(initial);
    }

    root.querySelectorAll('[data-knowledge-scroll-target]').forEach(function (button) {
      button.addEventListener('click', function () { scrollToSection(button.getAttribute('data-knowledge-scroll-target')); });
    });
    root.querySelectorAll('.knowledge-chapter-rail a, .knowledge-hero__scroll, [data-knowledge-route-link]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var id = (link.getAttribute('href') || '').replace(/^#/, '');
        if (!id || !document.getElementById(id)) return;
        event.preventDefault();
        scrollToSection(id);
      });
    });

    var chapters = Array.prototype.slice.call(root.querySelectorAll('[data-knowledge-chapter]'));
    var chapterLinks = Array.prototype.slice.call(root.querySelectorAll('[data-knowledge-chapter-link]'));
    var progressLabel = root.querySelector('[data-knowledge-progress-label]');
    var progressTitle = root.querySelector('[data-knowledge-progress-title]');
    var progressBar = root.querySelector('[data-knowledge-progress-bar]');
    var chapterOrder = chapterLinks.map(function (link) { return link.getAttribute('data-knowledge-chapter-link'); });
    function activateChapter(key) {
      var index = Math.max(0, chapterOrder.indexOf(key));
      if (progressLabel) progressLabel.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(chapterOrder.length).padStart(2, '0');
      if (progressTitle) {
        var chapter = chapters.filter(function (item) { return item.getAttribute('data-knowledge-chapter') === key; })[0];
        progressTitle.textContent = chapter ? (chapter.getAttribute('data-knowledge-chapter-title') || key) : key;
      }
      if (progressBar) progressBar.style.width = ((index + 1) / Math.max(chapterOrder.length, 1) * 100) + '%';
      chapterLinks.forEach(function (link) {
        var active = link.getAttribute('data-knowledge-chapter-link') === key;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }

    if (canObserve) {
      var chapterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activateChapter(entry.target.getAttribute('data-knowledge-chapter'));
        });
      }, { rootMargin: '-32% 0px -54% 0px', threshold: 0 });
      chapters.forEach(function (chapter) { chapterObserver.observe(chapter); });

      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -9% 0px', threshold: .08 });
      root.querySelectorAll('[data-knowledge-reveal]').forEach(function (element) { revealObserver.observe(element); });

      // A browser should never be able to hide the library merely because a
      // scroll observer is delayed.  Keep the entrance animation where it
      // works, then reveal any remaining content as a safe fallback.
      window.setTimeout(function () {
        root.querySelectorAll('[data-knowledge-reveal]:not(.is-visible)').forEach(function (element) {
          element.classList.add('is-visible');
        });
      }, 900);
    } else {
      root.querySelectorAll('[data-knowledge-reveal]').forEach(function (element) { element.classList.add('is-visible'); });
    }
    activateChapter('hero');

    var hero = root.querySelector('.knowledge-hero');
    var heroImage = hero && hero.querySelector('.page-header-bg img');
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (hero && heroImage && finePointer && !reducedMotion) {
      hero.addEventListener('pointermove', function (event) {
        var rect = hero.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width - .5) * 1.4;
        var y = ((event.clientY - rect.top) / rect.height - .5) * 1.2;
        heroImage.style.transform = 'scale(1.075) translate(' + x.toFixed(2) + '%, ' + y.toFixed(2) + '%)';
      });
      hero.addEventListener('pointerleave', function () { heroImage.style.transform = ''; });
    }
  });
}());
