/* CGM Photo Markup Tool v3.0 - Paint-like garden photo annotation.
   Tools: Pen (freehand draw), Label (preset + custom text), Eraser.
   Works on desktop (mouse) and mobile (touch).
   Up to 3 photos, each with its own canvas.
   Annotated images exported as JPEG for form submission. */
(function() {
  'use strict';

  var MAX_PHOTOS = 3;
  var PEN_COLORS = ['#c8543c', '#3a7fb5', '#5a9a3e', '#d9941f', '#8e5fa8', '#15281c'];
  var LABEL_PRESETS = [
    'Clear this section',
    'Retain this tree',
    'Replace this lawn',
    'Add screening here',
    'Repair this fence',
    'Access point',
    'Waste collection point'
  ];

  // State per photo slot
  var slots = [];
  for (var i = 0; i < MAX_PHOTOS; i++) {
    slots.push({
      image: null,
      labels: [],          // [{text, x, y, w, h}]
      strokes: [],         // [{points: [{x,y}], color, width}]
      canvas: null,
      ctx: null,
      currentStroke: null,
      activeLabelIdx: null,
      tool: 'pen',         // 'pen' | 'label' | 'eraser'
      penColor: PEN_COLORS[0],
      penWidth: 3
    });
  }

  var currentLabel = null;
  var currentTool = 'pen';
  var currentPenColor = PEN_COLORS[0];

  function init() {
    var root = document.getElementById('photoMarkupTool');
    if (!root) return;
    var testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext) { root.hidden = true; return; }
    buildUI(root);
    wireEvents();
  }

  function buildUI(root) {
    root.innerHTML = '';
    root.classList.add('photo-markup-tool');

    // Header
    var header = document.createElement('div');
    header.className = 'photo-markup-tool__header';
    header.innerHTML =
      '<span class="photo-markup-tool__kicker">Advanced (optional)</span>' +
      '<h3 class="photo-markup-tool__title">Mark up your photos</h3>' +
      '<p class="photo-markup-tool__lede">Draw on your photos to show us exactly what you want done. Use the pen to mark areas, or place labels for specific instructions. Like a simple paint tool - but for your garden.</p>';
    root.appendChild(header);

    // Photo slots
    var slotsWrap = document.createElement('div');
    slotsWrap.className = 'photo-markup-tool__slots';
    for (var i = 0; i < MAX_PHOTOS; i++) {
      var slot = document.createElement('div');
      slot.className = 'photo-markup-tool__slot';
      slot.setAttribute('data-slot', i);
      slot.innerHTML =
        '<div class="photo-markup-tool__slot-empty">' +
          '<input type="file" accept="image/*" class="photo-markup-tool__file-input" data-slot="' + i + '">' +
          '<label class="photo-markup-tool__upload-btn" tabindex="0">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>' +
            '<span>Add photo ' + (i + 1) + '</span>' +
          '</label>' +
        '</div>' +
        '<div class="photo-markup-tool__slot-active" hidden>' +
          '<div class="photo-markup-tool__slot-toolbar">' +
            '<span class="photo-markup-tool__slot-label-count" data-slot="' + i + '">0 marks</span>' +
            '<button type="button" class="photo-markup-tool__slot-clear-labels" data-slot="' + i + '">Clear marks</button>' +
            '<button type="button" class="photo-markup-tool__slot-clear" data-slot="' + i + '">Remove photo</button>' +
          '</div>' +
          '<div class="photo-markup-tool__canvas-wrap">' +
            '<canvas class="photo-markup-tool__canvas"></canvas>' +
          '</div>' +
        '</div>';
      slotsWrap.appendChild(slot);
    }
    root.appendChild(slotsWrap);

    // Global toolbar (tools + labels)
    var toolbar = document.createElement('div');
    toolbar.className = 'photo-markup-tool__global-toolbar';
    toolbar.innerHTML =
      '<div class="photo-markup-tool__tools-section">' +
        '<p class="photo-markup-tool__tools-label">Tool:</p>' +
        '<div class="photo-markup-tool__tools-row">' +
          '<button type="button" class="photo-markup-tool__tool is-active" data-tool="pen">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>' +
            '<span>Pen</span>' +
          '</button>' +
          '<button type="button" class="photo-markup-tool__tool" data-tool="label">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' +
            '<span>Label</span>' +
          '</button>' +
          '<button type="button" class="photo-markup-tool__tool" data-tool="eraser">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16c-1-1-1-2 0-3l9-9c1-1 2-1 3 0l6 6c1 1 1 2 0 3l-6 6"/><path d="M22 20H7"/></svg>' +
            '<span>Eraser</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="photo-markup-tool__colors-section" id="penColorsSection">' +
        '<p class="photo-markup-tool__tools-label">Pen colour:</p>' +
        '<div class="photo-markup-tool__colors-row">' +
          PEN_COLORS.map(function(c, idx) {
            return '<button type="button" class="photo-markup-tool__color' + (idx === 0 ? ' is-active' : '') + '" data-color="' + c + '" style="background:' + c + ';" aria-label="Pen colour ' + c + '"></button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="photo-markup-tool__labels-section" id="labelsSection" hidden>' +
        '<p class="photo-markup-tool__tools-label">Tap a label, then tap the photo to place it:</p>' +
        '<div class="photo-markup-tool__presets-row">' +
          LABEL_PRESETS.map(function(label) {
            return '<button type="button" class="photo-markup-tool__preset" data-label="' + label + '">' + label + '</button>';
          }).join('') +
        '</div>' +
        '<div class="photo-markup-tool__custom-label">' +
          '<input type="text" id="customLabelText" placeholder="Or type your own label..." maxlength="40">' +
          '<button type="button" class="btn btn-ghost" id="customLabelSet" style="border:1px solid var(--border-soft);padding:0.5rem 0.8rem;min-height:40px;">Set custom</button>' +
        '</div>' +
      '</div>' +
      '<div class="photo-markup-tool__active-indicator" id="activeIndicator">' +
        '<span>Pen tool active - draw on any photo with your finger or mouse.</span>' +
      '</div>';
    root.appendChild(toolbar);
  }

  function wireEvents() {
    var root = document.getElementById('photoMarkupTool');
    if (!root) return;

    // File inputs
    root.querySelectorAll('.photo-markup-tool__file-input').forEach(function(input) {
      input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var slotIdx = parseInt(input.getAttribute('data-slot'), 10);
        loadImageToSlot(file, slotIdx);
      });
    });

    // Upload button click
    root.querySelectorAll('.photo-markup-tool__upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var slot = btn.closest('.photo-markup-tool__slot');
        slot.querySelector('.photo-markup-tool__file-input').click();
      });
      btn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });

    // Clear buttons
    root.addEventListener('click', function(e) {
      if (e.target.classList.contains('photo-markup-tool__slot-clear')) {
        clearSlot(parseInt(e.target.getAttribute('data-slot'), 10));
      } else if (e.target.classList.contains('photo-markup-tool__slot-clear-labels')) {
        clearLabels(parseInt(e.target.getAttribute('data-slot'), 10));
      } else if (e.target.classList.contains('photo-markup-tool__tool')) {
        setTool(e.target.getAttribute('data-tool'));
      } else if (e.target.classList.contains('photo-markup-tool__color')) {
        setPenColor(e.target.getAttribute('data-color'));
      } else if (e.target.classList.contains('photo-markup-tool__preset')) {
        setCurrentLabel(e.target.getAttribute('data-label'));
      } else if (e.target.id === 'customLabelSet') {
        var input = document.getElementById('customLabelText');
        if (input && input.value.trim()) {
          setCurrentLabel(input.value.trim());
        }
      }
    });

    // Canvas interactions
    root.querySelectorAll('.photo-markup-tool__canvas').forEach(function(canvas) {
      var slotIdx = parseInt(canvas.closest('.photo-markup-tool__slot').getAttribute('data-slot'), 10);
      wireCanvas(canvas, slotIdx);
    });
  }

  function setTool(tool) {
    currentTool = tool;
    var root = document.getElementById('photoMarkupTool');
    root.querySelectorAll('.photo-markup-tool__tool').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-tool') === tool);
    });
    // Show/hide relevant sections
    var colorsSection = document.getElementById('penColorsSection');
    var labelsSection = document.getElementById('labelsSection');
    var indicator = document.getElementById('activeIndicator');
    if (colorsSection) colorsSection.hidden = (tool !== 'pen' && tool !== 'eraser');
    if (labelsSection) labelsSection.hidden = (tool !== 'label');
    if (indicator) {
      var msgs = {
        pen: 'Pen tool active - draw on any photo with your finger or mouse.',
        label: currentLabel ? 'Label tool active - tap a photo to place: "' + currentLabel + '"' : 'Label tool active - pick a label above first.',
        eraser: 'Eraser tool active - tap a label or stroke on any photo to remove it.'
      };
      indicator.innerHTML = '<span>' + msgs[tool] + '</span>';
      indicator.className = 'photo-markup-tool__active-indicator' + (tool === 'label' && currentLabel ? ' is-active' : '');
    }
    // Update cursor on canvases
    root.querySelectorAll('.photo-markup-tool__canvas').forEach(function(c) {
      c.style.cursor = tool === 'pen' ? 'crosshair' : (tool === 'eraser' ? 'pointer' : 'pointer');
    });
  }

  function setPenColor(color) {
    currentPenColor = color;
    var root = document.getElementById('photoMarkupTool');
    root.querySelectorAll('.photo-markup-tool__color').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-color') === color);
    });
  }

  function setCurrentLabel(label) {
    currentLabel = label;
    var root = document.getElementById('photoMarkupTool');
    root.querySelectorAll('.photo-markup-tool__preset').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-label') === label);
    });
    // Clear custom input if it matches
    var customInput = document.getElementById('customLabelText');
    if (customInput && customInput.value.trim() === label) {
      // It's the custom one - keep it
    } else if (customInput) {
      customInput.value = label;
    }
    var indicator = document.getElementById('activeIndicator');
    if (indicator) {
      indicator.innerHTML = '<span>Label tool active - tap a photo to place: <strong>"' + label + '"</strong></span>';
      indicator.className = 'photo-markup-tool__active-indicator is-active';
    }
  }

  function wireCanvas(canvas, slotIdx) {
    var slot = slots[slotIdx];
    slot.canvas = canvas;
    slot.ctx = canvas.getContext('2d');

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var cx, cy;
      if (e.touches && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches[0]) {
        cx = e.changedTouches[0].clientX;
        cy = e.changedTouches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }
      return {
        x: (cx - rect.left) / rect.width,
        y: (cy - rect.top) / rect.height
      };
    }

    var isDrawing = false;

    function handleStart(e) {
      e.preventDefault();
      var pos = getPos(e);
      if (currentTool === 'pen') {
        isDrawing = true;
        slot.currentStroke = {
          points: [pos],
          color: currentPenColor,
          width: slot.penWidth
        };
      } else if (currentTool === 'label') {
        if (!currentLabel) {
          flashHint('Pick a label above first');
          return;
        }
        slot.labels.push({ text: currentLabel, x: pos.x, y: pos.y });
        renderSlot(slotIdx);
        updateLabelCount(slotIdx);
      } else if (currentTool === 'eraser') {
        // Try to remove a label first, then a stroke
        var labelIdx = findLabelAt(slot, pos.x, pos.y);
        if (labelIdx !== -1) {
          slot.labels.splice(labelIdx, 1);
          renderSlot(slotIdx);
          updateLabelCount(slotIdx);
          return;
        }
        var strokeIdx = findStrokeAt(slot, pos.x, pos.y);
        if (strokeIdx !== -1) {
          slot.strokes.splice(strokeIdx, 1);
          renderSlot(slotIdx);
          updateLabelCount(slotIdx);
        }
      }
    }

    function handleMove(e) {
      if (!isDrawing || currentTool !== 'pen') return;
      e.preventDefault();
      var pos = getPos(e);
      slot.currentStroke.points.push(pos);
      renderSlot(slotIdx);
    }

    function handleEnd(e) {
      if (!isDrawing) return;
      isDrawing = false;
      if (slot.currentStroke && slot.currentStroke.points.length > 1) {
        slot.strokes.push(slot.currentStroke);
        updateLabelCount(slotIdx);
      }
      slot.currentStroke = null;
    }

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
  }

  function findLabelAt(slot, x, y) {
    for (var i = slot.labels.length - 1; i >= 0; i--) {
      var l = slot.labels[i];
      var dx = Math.abs(l.x - x);
      var dy = Math.abs(l.y - y);
      if (dx < 0.15 && dy < 0.06) return i;
    }
    return -1;
  }

  function findStrokeAt(slot, x, y) {
    for (var i = slot.strokes.length - 1; i >= 0; i--) {
      var s = slot.strokes[i];
      for (var j = 0; j < s.points.length; j++) {
        var p = s.points[j];
        if (Math.abs(p.x - x) < 0.03 && Math.abs(p.y - y) < 0.03) return i;
      }
    }
    return -1;
  }

  function flashHint(msg) {
    var indicator = document.getElementById('activeIndicator');
    if (indicator) {
      var original = indicator.innerHTML;
      indicator.innerHTML = '<span style="color:#c8543c;">' + msg + '</span>';
      setTimeout(function() { indicator.innerHTML = original; }, 2000);
    }
  }

  function loadImageToSlot(file, slotIdx) {
    var slot = slots[slotIdx];
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        slot.image = img;
        slot.labels = [];
        slot.strokes = [];
        var slotEl = document.querySelector('.photo-markup-tool__slot[data-slot="' + slotIdx + '"]');
        slotEl.querySelector('.photo-markup-tool__slot-empty').hidden = true;
        slotEl.querySelector('.photo-markup-tool__slot-active').hidden = false;
        renderSlot(slotIdx);
        updateLabelCount(slotIdx);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearSlot(slotIdx) {
    var slot = slots[slotIdx];
    slot.image = null;
    slot.labels = [];
    slot.strokes = [];
    var slotEl = document.querySelector('.photo-markup-tool__slot[data-slot="' + slotIdx + '"]');
    slotEl.querySelector('.photo-markup-tool__slot-empty').hidden = false;
    slotEl.querySelector('.photo-markup-tool__slot-active').hidden = true;
    slotEl.querySelector('.photo-markup-tool__file-input').value = '';
    updateLabelCount(slotIdx);
  }

  function clearLabels(slotIdx) {
    var slot = slots[slotIdx];
    slot.labels = [];
    slot.strokes = [];
    renderSlot(slotIdx);
    updateLabelCount(slotIdx);
  }

  function updateLabelCount(slotIdx) {
    var slot = slots[slotIdx];
    var count = slot.labels.length + slot.strokes.length;
    var countEl = document.querySelector('.photo-markup-tool__slot-label-count[data-slot="' + slotIdx + '"]');
    if (countEl) {
      countEl.textContent = count + (count === 1 ? ' mark' : ' marks');
    }
  }

  function renderSlot(slotIdx) {
    var slot = slots[slotIdx];
    if (!slot.image || !slot.canvas) return;
    var canvas = slot.canvas;
    var ctx = slot.ctx;
    var img = slot.image;
    var maxW = 600;
    var scale = Math.min(1, maxW / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw strokes
    slot.strokes.forEach(function(stroke) {
      drawStroke(ctx, stroke, canvas.width, canvas.height);
    });

    // Draw current stroke (in progress)
    if (slot.currentStroke) {
      drawStroke(ctx, slot.currentStroke, canvas.width, canvas.height);
    }

    // Draw labels
    slot.labels.forEach(function(l) {
      var px = l.x * canvas.width;
      var py = l.y * canvas.height;
      drawLabel(ctx, l.text, px, py);
    });
  }

  function drawStroke(ctx, stroke, w, h) {
    if (stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
    for (var i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
    }
    ctx.stroke();
  }

  function drawLabel(ctx, text, x, y) {
    ctx.font = '600 13px Inter, -apple-system, sans-serif';
    var padding = 6;
    var metrics = ctx.measureText(text);
    var w = metrics.width + padding * 2;
    var h = 22;
    var bx = x - w / 2;
    var by = y - h / 2;

    ctx.fillStyle = 'rgba(21, 40, 28, 0.92)';
    roundRect(ctx, bx, by, w, h, 3);
    ctx.fill();

    ctx.fillStyle = '#c8a45e';
    roundRect(ctx, bx, by, 3, h, 1.5);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(text, bx + padding + 3, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- Public API ----
  window.cgmPhotoMarkup = {
    getAnnotatedImages: function() {
      var results = [];
      slots.forEach(function(slot, idx) {
        if (slot.canvas && slot.image) {
          try {
            var dataUrl = slot.canvas.toDataURL('image/jpeg', 0.85);
            results.push({
              slot: idx,
              dataUrl: dataUrl,
              blob: dataUrlToBlob(dataUrl),
              filename: 'garden-photo-' + (idx + 1) + '-annotated.jpg'
            });
          } catch (e) {}
        }
      });
      return results;
    },
    hasImages: function() {
      return slots.some(function(s) { return s.canvas && s.image; });
    }
  };

  function dataUrlToBlob(dataUrl) {
    var arr = dataUrl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], { type: mime });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ---- Modal popup system (v3.1) ----
// Click on a photo slot → opens large modal with full-size canvas → draw → save → close
(function() {
  function createModal() {
    var modal = document.createElement('div');
    modal.className = 'photo-markup-modal';
    modal.id = 'photoMarkupModal';
    modal.innerHTML =
      '<div class="photo-markup-modal__inner">' +
        '<div class="photo-markup-modal__header">' +
          '<h3 class="photo-markup-modal__title">Edit photo</h3>' +
          '<button type="button" class="photo-markup-modal__close" id="modalClose">&times;</button>' +
        '</div>' +
        '<div class="photo-markup-modal__body">' +
          '<div class="photo-markup-modal__canvas-wrap" id="modalCanvasWrap"></div>' +
          '<div class="photo-markup-modal__actions">' +
            '<button type="button" class="btn btn-ghost" id="modalCancel" style="border:1px solid var(--border-soft);">Cancel</button>' +
            '<button type="button" class="btn btn-primary" id="modalSave">Save &amp; close</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    
    // Close handlers
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', saveAndClose);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
    
    return modal;
  }
  
  var currentModalSlot = null;
  var modalCanvas = null;
  var modalCtx = null;
  
  function openModal(slotIdx) {
    var slot = slots[slotIdx];
    if (!slot.image) return;
    
    currentModalSlot = slotIdx;
    var modal = document.getElementById('photoMarkupModal') || createModal();
    
    // Create a large canvas in the modal
    var wrap = document.getElementById('modalCanvasWrap');
    wrap.innerHTML = '';
    
    modalCanvas = document.createElement('canvas');
    modalCanvas.className = 'photo-markup-tool__canvas';
    modalCanvas.style.maxWidth = '100%';
    modalCanvas.style.cursor = 'crosshair';
    wrap.appendChild(modalCanvas);
    
    modalCtx = modalCanvas.getContext('2d');
    
    // Draw at larger size (up to 800px wide)
    var maxW = 800;
    var scale = Math.min(1, maxW / slot.image.width);
    modalCanvas.width = slot.image.width * scale;
    modalCanvas.height = slot.image.height * scale;
    
    // Copy the slot's canvas content to the modal canvas
    modalCtx.drawImage(slot.canvas, 0, 0, modalCanvas.width, modalCanvas.height);
    
    // Wire up drawing on the modal canvas
    wireModalCanvas(slotIdx);
    
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  
  function wireModalCanvas(slotIdx) {
    var slot = slots[slotIdx];
    var isDrawing = false;
    var currentStroke = null;
    
    function getPos(e) {
      var rect = modalCanvas.getBoundingClientRect();
      var cx, cy;
      if (e.touches && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches[0]) {
        cx = e.changedTouches[0].clientX;
        cy = e.changedTouches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }
      return {
        x: (cx - rect.left) / rect.width,
        y: (cy - rect.top) / rect.height
      };
    }
    
    function handleStart(e) {
      e.preventDefault();
      var pos = getPos(e);
      if (currentTool === 'pen') {
        isDrawing = true;
        currentStroke = { points: [pos], color: currentPenColor, width: 3 };
      } else if (currentTool === 'label') {
        if (!currentLabel) { flashHint('Pick a label above first'); return; }
        slot.labels.push({ text: currentLabel, x: pos.x, y: pos.y });
        renderModal(slotIdx);
      } else if (currentTool === 'eraser') {
        var labelIdx = findLabelAt(slot, pos.x, pos.y);
        if (labelIdx !== -1) { slot.labels.splice(labelIdx, 1); renderModal(slotIdx); return; }
        var strokeIdx = findStrokeAt(slot, pos.x, pos.y);
        if (strokeIdx !== -1) { slot.strokes.splice(strokeIdx, 1); renderModal(slotIdx); }
      }
    }
    
    function handleMove(e) {
      if (!isDrawing || currentTool !== 'pen') return;
      e.preventDefault();
      var pos = getPos(e);
      currentStroke.points.push(pos);
      renderModal(slotIdx);
    }
    
    function handleEnd(e) {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke && currentStroke.points.length > 1) {
        slot.strokes.push(currentStroke);
      }
      currentStroke = null;
    }
    
    modalCanvas.addEventListener('mousedown', handleStart);
    modalCanvas.addEventListener('mousemove', handleMove);
    modalCanvas.addEventListener('mouseup', handleEnd);
    modalCanvas.addEventListener('mouseleave', handleEnd);
    modalCanvas.addEventListener('touchstart', handleStart, { passive: false });
    modalCanvas.addEventListener('touchmove', handleMove, { passive: false });
    modalCanvas.addEventListener('touchend', handleEnd);
    
    function renderModal(idx) {
      var s = slots[idx];
      if (!s.image) return;
      modalCtx.drawImage(s.image, 0, 0, modalCanvas.width, modalCanvas.height);
      s.strokes.forEach(function(stroke) {
        drawStrokeOn(modalCtx, stroke, modalCanvas.width, modalCanvas.height);
      });
      if (currentStroke) drawStrokeOn(modalCtx, currentStroke, modalCanvas.width, modalCanvas.height);
      s.labels.forEach(function(l) {
        var px = l.x * modalCanvas.width;
        var py = l.y * modalCanvas.height;
        drawLabelOn(modalCtx, l.text, px, py);
      });
    }
    
    // Store renderModal for this slot
    modalRenderFn = renderModal;
  }
  
  var modalRenderFn = null;
  
  function drawStrokeOn(ctx, stroke, w, h) {
    if (stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
    for (var i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
    }
    ctx.stroke();
  }
  
  function drawLabelOn(ctx, text, x, y) {
    ctx.font = '600 14px Inter, -apple-system, sans-serif';
    var padding = 6;
    var metrics = ctx.measureText(text);
    var w = metrics.width + padding * 2;
    var h = 24;
    var bx = x - w / 2;
    var by = y - h / 2;
    ctx.fillStyle = 'rgba(21, 40, 28, 0.92)';
    ctx.beginPath();
    ctx.moveTo(bx + 3, by);
    ctx.arcTo(bx + w, by, bx + w, by + h, 3);
    ctx.arcTo(bx + w, by + h, bx, by + h, 3);
    ctx.arcTo(bx, by + h, bx, by, 3);
    ctx.arcTo(bx, by, bx + w, by, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c8a45e';
    ctx.fillRect(bx, by, 3, h);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(text, bx + padding + 3, y);
  }
  
  function closeModal() {
    var modal = document.getElementById('photoMarkupModal');
    if (modal) modal.classList.remove('is-open');
    document.body.style.overflow = '';
    currentModalSlot = null;
  }
  
  function saveAndClose() {
    // Render back to the small slot canvas
    if (currentModalSlot !== null) {
      renderSlot(currentModalSlot);
      updateLabelCount(currentModalSlot);
    }
    closeModal();
  }
  
  // Wire up: click on slot canvas → open modal
  // Wait for DOM ready, then add click handlers to slot canvases
  function wireModalOpeners() {
    var root = document.getElementById('photoMarkupTool');
    if (!root) return;
    
    root.addEventListener('click', function(e) {
      // If clicking on a canvas inside a slot, open the modal
      if (e.target.classList.contains('photo-markup-tool__canvas')) {
        var slot = e.target.closest('.photo-markup-tool__slot');
        if (slot) {
          var slotIdx = parseInt(slot.getAttribute('data-slot'), 10);
          openModal(slotIdx);
        }
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireModalOpeners);
  } else {
    wireModalOpeners();
  }
})();
