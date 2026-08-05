(() => {
  const photos = Array.isArray(window.CGM_PHOTOS) ? window.CGM_PHOTOS : [];
  const stageOrder = { before: 0, during: 1, after: 2 };
  const groups = [...new Set(photos.map((photo) => photo.group))].sort((a, b) => a - b);
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const groupPhotos = (group) => photos.filter((photo) => photo.group === group).sort((a, b) => stageOrder[a.stage] - stageOrder[b.stage] || a.variant - b.variant);
  const firstOf = (items, stage) => items.find((photo) => photo.stage === stage);
  const stageLabel = (photo) => {
    if (!photo) return '';
    const base = photo.stage[0].toUpperCase() + photo.stage.slice(1);
    return photo.variant > 1 ? `${base} ${photo.variant}` : base;
  };
  const pad = (number) => String(number).padStart(2, '0');

  const state = {
    group: groups.includes(3) ? 3 : groups[0],
    stage: 'after',
    filter: 'all',
    search: '',
    groupFilter: 'all',
    selected: [],
    journeyIndex: Math.max(0, photos.findIndex((photo) => photo.id === 'view-03-after')),
    lightboxIndex: 0,
    guidedIndex: 0,
    guidedTimer: null,
    guidedPaused: false,
    compareA: null,
    compareB: null
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const setText = (selector, value) => $$(selector).forEach((element) => { element.textContent = value; });
  const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const updateStats = () => {
    setText('[data-stat-photos]', photos.length);
    setText('[data-stat-views]', groups.length);
    setText('[data-stat-stages]', new Set(photos.map((photo) => photo.stage)).size);
    setText('[data-stat-during]', photos.filter((photo) => photo.stage === 'during').length);
    setText('[data-journey-total]', photos.length);
  };

  const renderGroupRail = () => {
    const rail = $('[data-group-rail]');
    if (!rail) return;
    rail.innerHTML = groups.map((group) => {
      const items = groupPhotos(group);
      return `<button class="group-chip${group === state.group ? ' is-selected' : ''}" type="button" data-select-group="${group}" aria-pressed="${group === state.group}">
        <span class="group-chip__number">${pad(group)}</span><span class="group-chip__label">View ${pad(group)}</span><span class="group-chip__count">${items.length}</span>
      </button>`;
    }).join('');
  };

  const setStageViewer = (photo) => {
    if (!photo) return;
    const image = $('[data-stage-image]');
    const badge = $('[data-stage-badge]');
    if (image) { image.src = photo.file; image.alt = `${stageLabel(photo)} photograph for view ${pad(photo.group)}`; }
    if (badge) badge.textContent = `${stageLabel(photo)} / view ${pad(photo.group)}`;
    state.stage = photo.stageKey;
    $$('[data-stage-rail] button').forEach((button) => button.classList.toggle('is-active', button.dataset.photoId === photo.id));
  };

  const renderStageRail = (items) => {
    const rail = $('[data-stage-rail]');
    if (!rail) return;
    rail.innerHTML = items.map((photo) => `<button type="button" data-stage-photo="${photo.id}" data-photo-id="${photo.id}" class="${photo.stageKey === state.stage ? 'is-active' : ''}"><img src="${photo.file}" alt=""><span>${stageLabel(photo)}</span></button>`).join('');
  };

  const setCompareImages = (photoA, photoB, customLabels = null) => {
    if (!photoA || !photoB) return;
    state.compareA = photoA;
    state.compareB = photoB;
    const imageA = $('[data-compare-a]');
    const imageB = $('[data-compare-b]');
    if (imageA) { imageA.src = photoA.file; imageA.alt = `${stageLabel(photoA)} photograph for view ${pad(photoA.group)}`; }
    if (imageB) { imageB.src = photoB.file; imageB.alt = `${stageLabel(photoB)} photograph for view ${pad(photoB.group)}`; }
    const labelA = customLabels?.a || `${stageLabel(photoA)} / view ${pad(photoA.group)}`;
    const labelB = customLabels?.b || `${stageLabel(photoB)} / view ${pad(photoB.group)}`;
    const aLabel = $('[data-compare-label-a]');
    const bLabel = $('[data-compare-label-b]');
    if (aLabel) aLabel.textContent = labelA;
    if (bLabel) bLabel.textContent = labelB;
    const source = $('[data-compare-source]');
    if (source) source.textContent = `View ${pad(photoA.group)} / ${stageLabel(photoA).toLowerCase()} ↔ ${stageLabel(photoB).toLowerCase()}`;
    const description = $('[data-compare-description]');
    if (description) description.textContent = `Matched frame ${pad(photoA.group)}: ${stageLabel(photoA).toLowerCase()} to ${stageLabel(photoB).toLowerCase()}.`;
    const range = $('[data-compare-range]');
    const compare = $('[data-smart-compare]');
    if (range) range.value = '50';
    if (compare) compare.style.setProperty('--split', '50%');
    const label = $('[data-selected-group-label]');
    if (label) label.textContent = `View ${pad(photoA.group)} / ${groupPhotos(photoA.group).length} supplied frames`;
  };

  const selectGroup = (group) => {
    const items = groupPhotos(Number(group));
    if (!items.length) return;
    state.group = Number(group);
    const before = firstOf(items, 'before') || items[0];
    const after = [...items].reverse().find((photo) => photo.stage === 'after') || items[items.length - 1];
    state.stage = after.stageKey;
    renderGroupRail();
    renderStageRail(items);
    setCompareImages(before, after, { a: 'Before', b: 'After' });
    setStageViewer(after);
    $$('[data-compare-stages]').forEach((container) => {
      container.innerHTML = items.map((photo) => `<button class="stage-pill" type="button" data-stage-photo="${photo.id}" aria-pressed="${photo.id === after.id}">${stageLabel(photo)}</button>`).join('');
    });
  };

  const updateCompareRange = () => {
    const range = $('[data-compare-range]');
    const compare = $('[data-smart-compare]');
    const value = $('[data-compare-value]');
    if (!range || !compare) return;
    compare.style.setProperty('--split', `${range.value}%`);
    if (value) value.textContent = range.value;
  };

  const addSelection = (id) => {
    if (!byId.has(id)) return;
    if (state.selected.includes(id)) state.selected = state.selected.filter((item) => item !== id);
    else {
      if (state.selected.length >= 2) state.selected.shift();
      state.selected.push(id);
    }
    renderCompareDock();
    renderPhotoWall();
  };

  const renderCompareDock = () => {
    const dock = $('[data-compare-dock]');
    const thumbs = $('[data-compare-thumbs]');
    const label = $('[data-compare-dock-label]');
    if (!dock || !thumbs || !label) return;
    dock.hidden = state.selected.length === 0;
    thumbs.innerHTML = state.selected.map((id) => `<img src="${byId.get(id).file}" alt="">`).join('');
    label.textContent = `${state.selected.length} / 2 selected`;
  };

  const openSelectedPair = () => {
    if (state.selected.length !== 2) { scrollToId('archive'); return; }
    const a = byId.get(state.selected[0]);
    const b = byId.get(state.selected[1]);
    setCompareImages(a, b, { a: `${stageLabel(a)} / ${pad(a.group)}`, b: `${stageLabel(b)} / ${pad(b.group)}` });
    scrollToId('compare');
  };

  const renderPhotoWall = () => {
    const wall = $('[data-photo-wall]');
    const empty = $('[data-photo-empty]');
    if (!wall) return;
    const lowered = state.search.trim().toLowerCase();
    const filtered = photos.filter((photo) => {
      const groupItems = groupPhotos(photo.group);
      const hasDuring = groupItems.some((item) => item.stage === 'during');
      const searchMatch = !lowered || `${photo.group} ${photo.stage} ${photo.stageKey} ${photo.source}`.toLowerCase().includes(lowered);
      const stageMatch = state.filter === 'all' || (state.filter === 'multi' ? hasDuring : photo.stage === state.filter);
      const groupMatch = state.groupFilter === 'all' || photo.group === Number(state.groupFilter);
      return searchMatch && stageMatch && groupMatch;
    });
    if (empty) empty.hidden = filtered.length > 0;
    wall.innerHTML = filtered.map((photo) => `<article class="photo-card" data-photo-id="${photo.id}">
      <button class="photo-card__select${state.selected.includes(photo.id) ? ' is-selected' : ''}" type="button" data-select-photo="${photo.id}" aria-label="${state.selected.includes(photo.id) ? 'Remove from compare' : 'Add to compare'}">${state.selected.includes(photo.id) ? '✓' : '+'}</button>
      <button class="photo-card__open" type="button" data-open-photo="${photo.id}"><div class="photo-card__image"><img src="${photo.file}" alt="${stageLabel(photo)} photograph, view ${pad(photo.group)}" loading="lazy"></div><div class="photo-card__info"><b>View ${pad(photo.group)}</b><span>${stageLabel(photo)}</span></div></button>
    </article>`).join('');
  };

  const populateArchiveControls = () => {
    const select = $('[data-group-filter]');
    if (select) select.innerHTML += groups.map((group) => `<option value="${group}">View ${pad(group)}</option>`).join('');
  };

  const renderJourneyFilmstrip = () => {
    const filmstrip = $('[data-journey-filmstrip]');
    if (!filmstrip || !photos.length) return;
    const start = Math.max(0, Math.min(state.journeyIndex - 3, photos.length - 8));
    const visible = photos.slice(start, start + 8);
    filmstrip.innerHTML = visible.map((photo) => `<button type="button" class="${photo.id === photos[state.journeyIndex]?.id ? 'is-active' : ''}" data-journey-photo="${photo.id}"><img src="${photo.file}" alt="View ${pad(photo.group)} ${stageLabel(photo)}" loading="lazy"></button>`).join('');
  };

  const renderJourney = () => {
    const photo = photos[state.journeyIndex];
    if (!photo) return;
    const image = $('[data-journey-image]');
    if (image) { image.src = photo.file; image.alt = `${stageLabel(photo)} photograph for view ${pad(photo.group)}`; }
    setText('[data-journey-label]', `View ${pad(photo.group)} / ${stageLabel(photo).toLowerCase()}`);
    setText('[data-journey-index]', pad(state.journeyIndex + 1));
    setText('[data-journey-title]', photo.stage === 'during' ? 'The work in motion' : photo.stage === 'before' ? 'The starting frame' : 'The finished frame');
    setText('[data-journey-note]', `Frame ${state.journeyIndex + 1} of ${photos.length}. Use the filmstrip to move through every supplied view, or open this photograph full screen.`);
    renderJourneyFilmstrip();
  };

  const setJourneyIndex = (index) => {
    state.journeyIndex = (index + photos.length) % photos.length;
    renderJourney();
  };

  const openLightbox = (id) => {
    const index = photos.findIndex((photo) => photo.id === id);
    if (index < 0) return;
    state.lightboxIndex = index;
    const dialog = $('[data-lightbox]');
    if (!dialog) return;
    renderLightbox();
    document.body.classList.add('paddock-showroom--lightbox');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const renderLightbox = () => {
    const photo = photos[state.lightboxIndex];
    if (!photo) return;
    const image = $('[data-lightbox-image]');
    if (image) { image.src = photo.file; image.alt = `${stageLabel(photo)} photograph for view ${pad(photo.group)}`; image.style.transform = 'scale(1)'; }
    setText('[data-lightbox-title]', `View ${pad(photo.group)} / ${stageLabel(photo)}`);
    setText('[data-lightbox-caption]', `Supplied photograph / ${photo.source}`);
    setText('[data-lightbox-counter]', `${pad(state.lightboxIndex + 1)} / ${pad(photos.length)}`);
  };

  const closeLightbox = () => {
    const dialog = $('[data-lightbox]');
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('paddock-showroom--lightbox');
  };

  const startGuided = () => {
    if (!photos.length) return;
    stopGuided();
    state.guidedIndex = 0;
    state.guidedPaused = false;
    $('[data-guided-dock]')?.removeAttribute('hidden');
    document.body.classList.add('paddock-showroom--locked');
    scrollToId('journey');
    advanceGuided();
    state.guidedTimer = window.setInterval(() => { if (!state.guidedPaused) advanceGuided(); }, 4200);
  };

  const advanceGuided = () => {
    const photo = photos[state.guidedIndex];
    if (!photo) return;
    setJourneyIndex(state.guidedIndex);
    setText('[data-guided-step]', `${pad(state.guidedIndex + 1)} / ${pad(photos.length)}`);
    setText('[data-guided-label]', `View ${pad(photo.group)} / ${stageLabel(photo).toLowerCase()}`);
    const progress = $('[data-guided-progress]');
    if (progress) progress.style.width = `${((state.guidedIndex + 1) / photos.length) * 100}%`;
    state.guidedIndex += 1;
    if (state.guidedIndex >= photos.length) { state.guidedIndex = 0; }
  };

  const stopGuided = () => {
    if (state.guidedTimer) window.clearInterval(state.guidedTimer);
    state.guidedTimer = null;
    state.guidedPaused = false;
    $('[data-guided-dock]')?.setAttribute('hidden', '');
    document.body.classList.remove('paddock-showroom--locked');
  };

  const toggleGuided = () => {
    if (!state.guidedTimer) return startGuided();
    state.guidedPaused = !state.guidedPaused;
    const button = $('[data-guided-toggle]');
    if (button) button.textContent = state.guidedPaused ? 'Resume' : 'Pause';
  };

  const initInteractions = () => {
    updateStats();
    populateArchiveControls();
    renderPhotoWall();
    selectGroup(state.group);
    renderJourney();
    updateCompareRange();

    $('[data-compare-range]')?.addEventListener('input', updateCompareRange);
    document.addEventListener('click', (event) => {
      const target = event.target;
      const groupButton = target.closest('[data-select-group]');
      if (groupButton) selectGroup(groupButton.dataset.selectGroup);
      const stageButton = target.closest('[data-stage-photo]');
      if (stageButton) setStageViewer(byId.get(stageButton.dataset.stagePhoto));
      const openPhotoButton = target.closest('[data-open-photo]');
      if (openPhotoButton) openLightbox(openPhotoButton.dataset.openPhoto);
      const selectButton = target.closest('[data-select-photo]');
      if (selectButton) { event.stopPropagation(); addSelection(selectButton.dataset.selectPhoto); }
      const journeyButton = target.closest('[data-journey-photo]');
      if (journeyButton) setJourneyIndex(photos.findIndex((photo) => photo.id === journeyButton.dataset.journeyPhoto));
      const scrollButton = target.closest('[data-scroll-to]');
      if (scrollButton) scrollToId(scrollButton.dataset.scrollTo);
      const actionButton = target.closest('[data-action]');
      if (actionButton) {
        if (actionButton.dataset.action === 'walkthrough') startGuided();
        if (actionButton.dataset.action === 'photos') scrollToId('archive');
        if (actionButton.dataset.action === 'compare') scrollToId('compare');
      }
      if (target.closest('[data-start-walkthrough]')) startGuided();
      if (target.closest('[data-add-pair]')) {
        if (state.compareA) addSelection(state.compareA.id);
        if (state.compareB) addSelection(state.compareB.id);
      }
      if (target.closest('[data-open-pair-compare]')) openSelectedPair();
      if (target.closest('[data-clear-pair]')) { state.selected = []; renderCompareDock(); renderPhotoWall(); }
      if (target.closest('[data-journey-prev]')) setJourneyIndex(state.journeyIndex - 1);
      if (target.closest('[data-journey-next]')) setJourneyIndex(state.journeyIndex + 1);
      if (target.closest('[data-open-current-lightbox]')) openLightbox(photos[state.journeyIndex]?.id);
      if (target.closest('[data-guided-toggle]')) toggleGuided();
      if (target.closest('[data-lightbox-close]')) closeLightbox();
      if (target.closest('[data-lightbox-prev]')) { state.lightboxIndex = (state.lightboxIndex - 1 + photos.length) % photos.length; renderLightbox(); }
      if (target.closest('[data-lightbox-next]')) { state.lightboxIndex = (state.lightboxIndex + 1) % photos.length; renderLightbox(); }
      if (target.closest('[data-lightbox-zoom]')) {
        const image = $('[data-lightbox-image]');
        if (image) image.style.transform = image.style.transform === 'scale(1.55)' ? 'scale(1)' : 'scale(1.55)';
      }
    });

    $('[data-photo-search]')?.addEventListener('input', (event) => { state.search = event.target.value; renderPhotoWall(); });
    $('[data-group-filter]')?.addEventListener('change', (event) => { state.groupFilter = event.target.value; renderPhotoWall(); });
    $$('[data-stage-filter]').forEach((button) => button.addEventListener('click', () => {
      state.filter = button.dataset.stageFilter;
      $$('[data-stage-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderPhotoWall();
    }));
    $('[data-lightbox]')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeLightbox(); });
    $('[data-lightbox]')?.addEventListener('close', () => document.body.classList.remove('paddock-showroom--lightbox'));
  };

  const initObservers = () => {
    const chapters = $$('[data-chapter]');
    const railLinks = $$('[data-chapter-link]');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.chapterLink === entry.target.dataset.chapter));
        const index = chapters.indexOf(entry.target);
        const progress = $('[data-progress-bar]');
        if (progress && index >= 0) progress.style.width = `${((index + 1) / chapters.length) * 100}%`;
        const label = $('[data-progress-label]');
        if (label && index >= 0) label.textContent = `${pad(index + 1)} / ${pad(chapters.length)}`;
      }), { rootMargin: '-34% 0 -55% 0', threshold: 0 });
      chapters.forEach((chapter) => observer.observe(chapter));

      const reveal = new IntersectionObserver((entries, ob) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); ob.unobserve(entry.target); } }), { threshold: .1 });
      $$('.reveal').forEach((item) => reveal.observe(item));
    } else $$('.reveal').forEach((item) => item.classList.add('is-visible'));
  };

  const initKeyboard = () => {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { closeLightbox(); stopGuided(); }
      if ($('[data-lightbox]')?.open) {
        if (event.key === 'ArrowLeft') { state.lightboxIndex = (state.lightboxIndex - 1 + photos.length) % photos.length; renderLightbox(); }
        if (event.key === 'ArrowRight') { state.lightboxIndex = (state.lightboxIndex + 1) % photos.length; renderLightbox(); }
      }
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); $('[data-photo-search]')?.focus(); }
      if (event.key === ' ' && state.guidedTimer && document.activeElement?.tagName !== 'BUTTON') { event.preventDefault(); toggleGuided(); }
    });
  };

  const initParallax = () => {
    const hero = $('[data-hero-parallax]');
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) return;
    const image = $('[data-hero-image]', hero);
    hero.addEventListener('pointermove', (event) => { const rect = hero.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - .5; const y = (event.clientY - rect.top) / rect.height - .5; image.style.transform = `scale(1.045) translate(${x * -10}px,${y * -7}px)`; });
    hero.addEventListener('pointerleave', () => { image.style.transform = 'scale(1.03)'; });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initInteractions();
    initObservers();
    initKeyboard();
    initParallax();
    window.setTimeout(() => $('[data-loading]')?.classList.add('is-done'), 350);
  });
})();
