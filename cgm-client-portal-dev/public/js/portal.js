/**
 * CGM Client Portal - front-end JS
 * Powers /portal/ (household view) - loads client data, renders notes,
 * images, handles note posting and image uploads.
 */

(function() {
  'use strict';

  // ---------- State ----------
  var state = {
    authenticated: false,
    isAdmin: false,
    clientId: null,
    data: null,
    pendingUploads: [],
  };

  // ---------- DOM ----------
  var $ = function(id) { return document.getElementById(id); };
  var loadingState = $('loadingState');
  var notAuthState = $('notAuthState');
  var portalContent = $('portalContent');
  var adminBanner = $('adminBanner');

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    $('year') && ($('year').textContent = new Date().getFullYear());

    // Check session
    try {
      var res = await fetch('/api/auth-session', { credentials: 'include' });
      var session = await res.json();
      if (!session.authenticated) {
        showNotAuth();
        return;
      }
      state.authenticated = true;
      state.isAdmin = session.isAdmin === true;
      state.clientId = session.client?.id || null;

      // Admin without a client selected -> check URL for ?clientId=
      if (state.isAdmin && !state.clientId) {
        var params = new URLSearchParams(window.location.search);
        var urlClientId = parseInt(params.get('clientId') || '0', 10);
        if (urlClientId) {
          state.clientId = urlClientId;
        } else {
          window.location.replace('/portal/admin/dashboard/');
          return;
        }
      }

      // Admin viewing a client -> show banner
      if (state.isAdmin) {
        adminBanner.hidden = false;
      }

      await loadClientData();
      if (window.CGMPortal) window.CGMPortal.setupNavigation({ isAdmin: state.isAdmin, clientId: state.clientId }, 'overview');
      bindEvents();
      loadingState.hidden = true;
      portalContent.hidden = false;
    } catch (err) {
      console.error('[portal] init failed:', err);
      showNotAuth();
    }
  }

  function showNotAuth() {
    loadingState.hidden = true;
    notAuthState.hidden = false;
  }

  // ---------- Load data ----------
  async function loadClientData() {
    var url = '/api/client-data';
    if (state.isAdmin && state.clientId) {
      url += '?clientId=' + encodeURIComponent(state.clientId);
    }
    var res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) { showNotAuth(); return; }
      throw new Error('Failed to load client data: ' + res.status);
    }
    var json = await res.json();
    state.data = json;
    render();
  }

  // ---------- Render ----------
  function render() {
    var c = state.data.client;
    document.title = c.householdName + ' | Client Portal | Chiltern Garden Maintenance';
    $('householdBadge').textContent = state.isAdmin ? 'Admin viewing client' : 'Household';
    $('householdName').textContent = c.householdName;
    $('householdSub').textContent = c.addressLine || c.serviceArea || 'Your private client portal';
    $('householdEmail').textContent = c.email;
    $('householdArea').textContent = c.serviceArea || '—';
    $('householdSince').textContent = formatDate(c.relationshipStarted);

    renderLatestVisit();
    renderNotes();
    renderImages();
    renderComposerForRole();
  }

  function renderComposerForRole() {
    // Clients can post notes (always client_note type).
    // Admins can post any note type - show type selector + visit date.
    var composerSection = $('composerSection');
    var composerMeta = composerSection.querySelector('.composer-meta');
    if (state.isAdmin) {
      // Add type selector + visit date input if not already present
      if (!$('noteTypeSelect')) {
        var typeSelect = document.createElement('select');
        typeSelect.id = 'noteTypeSelect';
        typeSelect.innerHTML =
          '<option value="update">Update note (visible to client)</option>' +
          '<option value="visit">Visit note (records a visit)</option>';
        composerMeta.insertBefore(typeSelect, composerMeta.firstChild);

        var dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'noteVisitDate';
        dateInput.value = new Date().toISOString().slice(0, 10);
        composerMeta.insertBefore(dateInput, typeSelect.nextSibling);

        // Hide the upload block for admin (uploads happen from the dashboard OR same - keep)
        // Actually keep - admin can upload from here too.
      }
      var para = composerSection.querySelector('p');
      if (para) {
        para.textContent = 'Post an update or record a visit. Visit notes appear in the "Most recent visit" callout. Update notes notify the client by email.';
      }
      $('postNoteBtn').textContent = 'Post update';
    } else {
      var introP = composerSection.querySelector('p');
      if (introP) {
        introP.textContent = 'Leave a message, question, or update for your gardener. Only you and Chiltern Garden Maintenance can see this.';
      }
    }
  }

  function renderLatestVisit() {
    var lv = state.data.latestVisit;
    if (!lv) {
      $('lvTitle').textContent = 'No visit recorded yet';
      $('lvDate').textContent = '';
      $('lvBody').innerHTML = '<span class="lv-empty">Once your gardener records a visit, the latest progress notes will appear here.</span>';
      return;
    }
    $('lvTitle').textContent = lv.title || 'Visit summary';
    $('lvDate').textContent = lv.visitDate
      ? 'Visit date: ' + formatDate(lv.visitDate) + ' · Recorded ' + formatRelative(lv.createdAt)
      : 'Recorded ' + formatRelative(lv.createdAt);
    $('lvBody').textContent = lv.body;
  }

  function renderNotes() {
    var notes = state.data.notes || [];
    $('notesCount').textContent = notes.length;
    var list = $('notesList');
    if (notes.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="es-icon">&#128221;</div><p>No notes yet. Start the conversation by adding a note above.</p></div>';
      return;
    }
    list.innerHTML = notes.map(function(n) {
      var cls = ['note-card'];
      if (n.authorType === 'admin') cls.push('admin-note');
      else cls.push('client-note');
      if (n.noteType === 'visit') cls.push('visit-note');
      if (n.pinned) cls.push('pinned');

      var tag = '';
      if (n.noteType === 'visit') tag = '<span class="note-tag visit">Visit</span>';
      else if (n.noteType === 'update') tag = '<span class="note-tag update">Update</span>';
      else tag = '<span class="note-tag client">Your note</span>';

      var pinIcon = n.pinned ? '<span class="note-pin-icon" title="Pinned by CGM">&#128204;</span>' : '';
      var titleHtml = n.title ? '<div class="note-title">' + escapeHtml(n.title) + '</div>' : '';
      var visitDateHtml = n.visitDate ? ' · Visit: ' + formatDate(n.visitDate) : '';

      return '<article class="' + cls.join(' ') + '">' +
        '<div class="note-head">' +
          '<div><span class="note-author">' + pinIcon + escapeHtml(n.authorName || (n.authorType === 'admin' ? 'CGM' : 'You')) + '</span></div>' +
          '<div class="note-meta">' + tag + '<span>' + formatRelative(n.createdAt) + visitDateHtml + '</span></div>' +
        '</div>' +
        titleHtml +
        '<div class="note-body">' + escapeHtml(n.body) + '</div>' +
      '</article>';
    }).join('');
  }

  function renderImages() {
    var imgs = state.data.images || [];
    $('imagesCount').textContent = imgs.length;
    var grid = $('portfolioGrid');
    if (imgs.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="es-icon">&#128247;</div><p>No images yet. Upload your first photo above.</p></div>';
      return;
    }
    grid.innerHTML = imgs.map(function(img) {
      var catLabel = {
        progress: 'Progress',
        before_after: 'Before / After',
        reference: 'Reference',
        client_upload: 'Your upload'
      }[img.category] || 'Image';
      var uploader = img.uploaderType === 'admin' ? 'CGM' : 'You';
      var captionHtml = img.caption ? '<div class="pi-caption">' + escapeHtml(img.caption) + '</div>' : '';
      var deleteBtn = state.isAdmin ? '<button class="pi-delete" data-id="' + img.id + '" title="Delete image" aria-label="Delete image">&times;</button>' : '';
      return '<div class="portfolio-item" data-url="' + img.url + '" data-caption="' + escapeHtml(img.caption || '') + '">' +
        '<img src="' + img.url + '" alt="' + escapeHtml(img.caption || img.filename) + '" loading="lazy">' +
        deleteBtn +
        '<div class="pi-overlay">' +
          '<span class="pi-cat">' + catLabel + ' · ' + uploader + '</span>' +
          captionHtml +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ---------- Events ----------
  function bindEvents() {
    $('logoutBtn').addEventListener('click', logout);

    // Note composer
    var noteBody = $('noteBody');
    noteBody.addEventListener('input', function() {
      $('charCount').textContent = noteBody.value.length;
    });
    $('postNoteBtn').addEventListener('click', postNote);

    // Image upload
    bindUpload();

    // Portfolio click -> lightbox
    $('portfolioGrid').addEventListener('click', function(e) {
      // Delete?
      var delBtn = e.target.closest('.pi-delete');
      if (delBtn) {
        e.stopPropagation();
        handleImageDelete(parseInt(delBtn.dataset.id, 10));
        return;
      }
      var item = e.target.closest('.portfolio-item');
      if (item) {
        openLightbox(item.dataset.url, item.dataset.caption);
      }
    });
  }

  async function logout() {
    try {
      await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    window.location.href = '/login/';
  }

  async function postNote() {
    var body = $('noteBody').value.trim();
    if (!body) return;

    var payload = { body: body };
    if (state.isAdmin) {
      var typeSel = $('noteTypeSelect');
      var dateInput = $('noteVisitDate');
      if (typeSel) payload.noteType = typeSel.value;
      if (dateInput && dateInput.value) payload.visitDate = dateInput.value;
      payload.clientId = state.clientId;
    }

    $('postNoteBtn').disabled = true;
    $('postNoteBtn').textContent = 'Posting…';
    try {
      var res = await fetch('/api/client-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (data.ok) {
        $('noteBody').value = '';
        $('charCount').textContent = '0';
        await loadClientData();
      } else {
        alert(data.error || 'Failed to post note.');
      }
    } catch (e) {
      alert('Network error. Please try again.');
    } finally {
      $('postNoteBtn').disabled = false;
      $('postNoteBtn').textContent = state.isAdmin ? 'Post update' : 'Post note';
    }
  }

  // ---------- Upload ----------
  function bindUpload() {
    var zone = $('uploadZone');
    var input = $('fileInput');
    var preview = $('uploadPreview');
    var uploadBtn = $('uploadBtn');

    zone.addEventListener('click', function() { input.click(); });
    zone.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });

    input.addEventListener('change', function() {
      handleFiles(input.files);
    });

    zone.addEventListener('dragover', function(e) {
      e.preventDefault();
      zone.classList.add('dragging');
    });
    zone.addEventListener('dragleave', function() { zone.classList.remove('dragging'); });
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      zone.classList.remove('dragging');
      handleFiles(e.dataTransfer.files);
    });

    uploadBtn.addEventListener('click', uploadPending);
  }

  function handleFiles(fileList) {
    var preview = $('uploadPreview');
    var uploadBtn = $('uploadBtn');
    Array.from(fileList).forEach(function(file) {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('"' + file.name + '" is larger than 10MB and was skipped.');
        return;
      }
      state.pendingUploads.push(file);
      var reader = new FileReader();
      reader.onload = function(e) {
        var div = document.createElement('div');
        div.className = 'up-item';
        div.dataset.name = file.name;
        div.innerHTML = '<img src="' + e.target.result + '" alt="' + escapeHtml(file.name) + '">' +
          '<button class="up-remove" title="Remove" aria-label="Remove">&times;</button>';
        div.querySelector('.up-remove').addEventListener('click', function() {
          state.pendingUploads = state.pendingUploads.filter(function(f) { return f.name !== file.name || f.size !== file.size; });
          div.remove();
          if (state.pendingUploads.length === 0) uploadBtn.disabled = true;
        });
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
    uploadBtn.disabled = state.pendingUploads.length === 0;
  }

  async function uploadPending() {
    var uploadBtn = $('uploadBtn');
    var caption = $('uploadCaption').value.trim();
    if (state.pendingUploads.length === 0) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading…';
    var okCount = 0;
    var failCount = 0;

    for (var i = 0; i < state.pendingUploads.length; i++) {
      var file = state.pendingUploads[i];
      var fd = new FormData();
      fd.append('file', file);
      fd.append('caption', caption);
      if (state.isAdmin) {
        fd.append('category', 'progress');
        fd.append('clientId', state.clientId);
      } else {
        fd.append('category', 'client_upload');
      }
      try {
        var res = await fetch('/api/client-image', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        var data = await res.json();
        if (data.ok) okCount++;
        else { console.error(data.error); failCount++; }
      } catch (e) {
        console.error(e);
        failCount++;
      }
    }

    // Reset
    state.pendingUploads = [];
    $('uploadPreview').innerHTML = '';
    $('uploadCaption').value = '';
    uploadBtn.textContent = 'Upload images';
    uploadBtn.disabled = true;

    await loadClientData();

    if (failCount > 0) {
      alert('Uploaded ' + okCount + ' image(s). ' + failCount + ' failed - please try again.');
    }
  }

  async function handleImageDelete(imageId) {
    if (!state.isAdmin) return;
    if (!confirm('Delete this image permanently? This cannot be undone.')) return;
    try {
      var res = await fetch('/api/admin-image?id=' + imageId, {
        method: 'DELETE',
        credentials: 'include',
      });
      var data = await res.json();
      if (data.ok) {
        await loadClientData();
      } else {
        alert(data.error || 'Failed to delete image.');
      }
    } catch (e) {
      alert('Network error.');
    }
  }

  // ---------- Lightbox ----------
  function openLightbox(url, caption) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<img src="' + url + '" alt="' + escapeHtml(caption || '') + '">';
    lb.addEventListener('click', function() { lb.remove(); });
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    // Watch for removal to restore overflow
    var observer = new MutationObserver(function() {
      if (!document.body.contains(lb)) {
        document.body.style.overflow = '';
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
  }

  // ---------- Helpers ----------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(s) {
    if (!s) return '—';
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatRelative(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    var diff = Date.now() - d.getTime();
    var sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + ' min ago';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' hr ago';
    var day = Math.floor(hr / 24);
    if (day < 7) return day + ' day' + (day === 1 ? '' : 's') + ' ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
})();
