/* Mobile quick-link dock. Uses CSS view-timeline where available and GSAP's
   ScrollTrigger fallback when the browser does not expose that API. */
(function () {
  'use strict';
  function init() {
    var dock = document.querySelector('.swipe-row');
    var scroller = dock;
    var items = scroller ? scroller.querySelectorAll('.swipe-row__item') : [];
    if (!dock || !scroller || !items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    dock.classList.add('cgm-scroll-dock');
    if (CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
    // Keep the progressive enhancement optional: if a visitor is offline or
    // blocks module imports, the dock remains a normal native scroller.
    import('https://esm.sh/gsap@3.12.0').then(function (gsapModule) {
      return import('https://esm.sh/gsap@3.12.0/ScrollTrigger').then(function (pluginModule) {
        var gsap = gsapModule.default || gsapModule.gsap || gsapModule;
        var ScrollTrigger = pluginModule.default || pluginModule.ScrollTrigger || pluginModule;
        if (!gsap || !ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);
        Array.prototype.forEach.call(items, function (item) {
          gsap.timeline().fromTo(item, { scale: 1, '--dock-blur': 0 }, {
            scale: 0.86, '--dock-blur': 1, ease: 'power1.inOut', scrollTrigger: {
              trigger: item, scroller: scroller, horizontal: true, start: 'left 1.5rem', end: 'right 0', scrub: 0.2
            }
          });
        });
      });
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
