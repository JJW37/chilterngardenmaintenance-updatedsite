/* CGM predictive search: suggestions, typo tolerance, and keyboard selection. */
(function () {
  'use strict';

  function normalise(value) {
    return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function distance(a, b) {
    var row = Array.from({ length: b.length + 1 }, function (_, i) { return i; });
    for (var i = 1; i <= a.length; i++) {
      var previous = row[0];
      row[0] = i;
      for (var j = 1; j <= b.length; j++) {
        var current = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = current;
      }
    }
    return row[b.length];
  }
  function score(query, value) {
    var q = normalise(query);
    var v = normalise(value);
    if (!q || !v) return 0;
    if (v === q) return 100;
    if (v.indexOf(q) === 0) return 90;
    if (v.indexOf(q) !== -1) return 75;
    var terms = v.split(' ');
    var best = Math.min.apply(Math, terms.map(function (term) { return distance(q, term); }));
    return best <= Math.max(1, Math.floor(q.length / 3)) ? 60 - best : 0;
  }
  function setMenuPosition(input, menu) {
    var wrap = input.closest('.plant-search-premium__wrap, .search-wrap, .location-search__input-wrap') || input.parentElement;
    if (wrap && !wrap.contains(menu)) wrap.appendChild(menu);
  }
  function initInput(input) {
    if (input.dataset.predictiveReady === 'true') return;
    input.dataset.predictiveReady = 'true';
    var menu = document.createElement('div');
    menu.className = 'cgm-predictive-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'listbox');
    setMenuPosition(input, menu);
    var cards = Array.prototype.slice.call(document.querySelectorAll(input.dataset.predictiveSearch === 'plants' ? '.plant-card-premium' : '.tip-card'));
    var active = -1;
    function hide() { menu.hidden = true; active = -1; }
    function display() {
      var query = input.value.trim();
      if (query.length < 2 || !cards.length) { hide(); return; }
      var matches = cards.map(function (card) {
        var label = card.querySelector('h3, .plant-card-premium__name, .editorial-row__title');
        var value = (label ? label.textContent : '') + ' ' + (card.getAttribute('data-search') || '');
        return { card: card, value: value, title: label ? label.textContent.trim() : value.trim(), score: score(query, value) };
      }).filter(function (item) { return item.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 6);
      if (!matches.length) { hide(); return; }
      menu.innerHTML = matches.map(function (item, index) {
        return '<button type="button" class="cgm-predictive-menu__item" role="option" data-index="' + index + '"><strong>' + item.title + '</strong><span>Open matching page</span></button>';
      }).join('');
      menu.hidden = false;
      menu.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('mouseenter', function () { active = parseInt(button.dataset.index, 10); });
        button.addEventListener('click', function () {
          var item = matches[parseInt(button.dataset.index, 10)];
          if (item) item.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          hide();
        });
      });
      input._cgmMatches = matches;
    }
    input.addEventListener('input', display);
    input.addEventListener('keydown', function (event) {
      if (menu.hidden) return;
      var buttons = menu.querySelectorAll('button');
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        active = event.key === 'ArrowDown' ? Math.min(active + 1, buttons.length - 1) : Math.max(active - 1, 0);
        buttons.forEach(function (button, index) { button.classList.toggle('is-active', index === active); });
      } else if (event.key === 'Enter' && active >= 0 && buttons[active]) {
        event.preventDefault();
        buttons[active].click();
      } else if (event.key === 'Escape') hide();
    });
    document.addEventListener('click', function (event) { if (!input.contains(event.target) && !menu.contains(event.target)) hide(); });
  }
  function init() {
    document.querySelectorAll('input[data-predictive-search="plants"], input[data-predictive-search="tips"]').forEach(initInput);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
