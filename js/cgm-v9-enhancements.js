/* ==========================================================================
   CGM v9 Enhancements — Unified Photo Upload + Editor
   Replaces the two-step upload + advanced disclosure with a single upload
   zone at the top of the form. On file selection, the editor opens
   full-screen with a side toolbar (pen / label / erase / colors).
   Works on both mobile and desktop.
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ----- ISSUE 1: Unified photo upload + full-screen editor ----- */
  function wireUnifiedPhotoUpload() {
    var form = document.getElementById('quoteForm');
    if (!form) return;
    if (form.dataset.unifiedPhotoWired === 'true') return;
    form.dataset.unifiedPhotoWired = 'true';

    // Find the existing photo upload step
    var oldUploadStep = null;
    var steps = form.querySelectorAll('.calc-step');
    steps.forEach(function (step) {
      if (step.querySelector('#photos')) oldUploadStep = step;
    });
    if (!oldUploadStep) return;

    // Also find the advanced disclosure step
    var advancedStep = null;
    steps.forEach(function (step) {
      if (step.querySelector('.quote-advanced')) advancedStep = step;
    });

    // Create the new unified upload zone
    var newStep = document.createElement('div');
    newStep.className = 'calc-step';
    newStep.innerHTML =
      '<label style="font-weight:600;color:var(--forest-deep);margin-bottom:0.5rem;display:block;">Attach photos <span class="hint" style="font-weight:400;color:var(--muted);">(optional, but helps us give a more accurate quote)</span></label>' +
      '<div class="quote-photo-upload-zone" id="unifiedUploadZone">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>' +
        '<p class="quote-photo-upload-zone__title">Tap to upload garden photos</p>' +
        '<p class="quote-photo-upload-zone__hint">You can add multiple photos and edit them with pen, labels, and erase tools.</p>' +
        '<input type="file" id="unifiedPhotos" accept="image/*" multiple>' +
      '</div>' +
      '<div class="quote-photo-thumbs" id="unifiedThumbs"></div>';

    // Insert the new step at the TOP of the form (before name)
    form.insertBefore(newStep, form.firstChild);

    // Hide the old upload step and advanced step
    if (oldUploadStep) oldUploadStep.style.display = 'none';
    if (advancedStep) advancedStep.style.display = 'none';

    var fileInput = newStep.querySelector('#unifiedPhotos');
    var thumbsContainer = newStep.querySelector('#unifiedThumbs');
    var uploadedFiles = [];

    // Create the full-screen editor modal
    var editorModal = document.createElement('div');
    editorModal.className = 'photo-editor-modal';
    editorModal.hidden = true;
    editorModal.innerHTML =
      '<div class="photo-editor-modal__header">' +
        '<h3 class="photo-editor-modal__title">Edit photo</h3>' +
        '<span class="photo-editor-modal__counter" id="editorCounter">1 of 1</span>' +
        '<button type="button" class="photo-editor-modal__done" id="editorDone">Done</button>' +
        '<button type="button" class="photo-editor-modal__close" id="editorClose">&times;</button>' +
      '</div>' +
      '<div class="photo-editor-modal__body">' +
        '<div class="photo-editor-modal__canvas-wrap" id="editorCanvasWrap">' +
          '<button type="button" class="photo-editor-modal__nav photo-editor-modal__nav--prev" id="editorPrev"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
          '<button type="button" class="photo-editor-modal__nav photo-editor-modal__nav--next" id="editorNext"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
        '</div>' +
        '<div class="photo-editor-modal__toolbar">' +
          '<button type="button" class="photo-editor-modal__tool is-active" data-tool="pen" data-label="Pen">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' +
            '<span class="photo-editor-modal__tool-label">Pen</span>' +
          '</button>' +
          '<button type="button" class="photo-editor-modal__tool" data-tool="label" data-label="Add Label">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"/><path d="M7 10h10"/></svg>' +
            '<span class="photo-editor-modal__tool-label">Add Label</span>' +
          '</button>' +
          '<button type="button" class="photo-editor-modal__tool" data-tool="erase" data-label="Erase">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h12"/><path d="M5 13l6-6 6 6-6 6H8l-3-3Z"/></svg>' +
            '<span class="photo-editor-modal__tool-label">Erase</span>' +
          '</button>' +
          '<div class="photo-editor-modal__tool-divider"></div>' +
          '<div class="photo-editor-modal__color-picker">' +
            '<span class="photo-editor-modal__color is-active" data-color="#b89243" style="background:#b89243;"></span>' +
            '<span class="photo-editor-modal__color" data-color="#dc2626" style="background:#dc2626;"></span>' +
            '<span class="photo-editor-modal__color" data-color="#2563eb" style="background:#2563eb;"></span>' +
            '<span class="photo-editor-modal__color" data-color="#16a34a" style="background:#16a34a;"></span>' +
            '<span class="photo-editor-modal__color" data-color="#ffffff" style="background:#ffffff;"></span>' +
          '</div>' +
          '<div class="photo-editor-modal__tool-divider"></div>' +
          '<button type="button" class="photo-editor-modal__tool" data-action="clear" data-label="Clear">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
            '<span class="photo-editor-modal__tool-label">Clear</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(editorModal);

    var currentTool = 'pen';
    var currentColor = '#b89243';
    var currentPhotoIdx = 0;
    var editorCanvas = null;
    var editorCtx = null;
    var isDrawing = false;

    // File input handler
    fileInput.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      if (!files.length) return;

      files.forEach(function (file) {
        var url = URL.createObjectURL(file);
        uploadedFiles.push({
          file: file,
          url: url,
          image: null,
          strokes: [],
          edited: false
        });
      });

      renderThumbs();
      openEditor(uploadedFiles.length - files.length);
      fileInput.value = '';
    });

    function renderThumbs() {
      thumbsContainer.innerHTML = '';
      uploadedFiles.forEach(function (photo, idx) {
        var thumb = document.createElement('div');
        thumb.className = 'quote-photo-thumb' + (photo.edited ? ' quote-photo-thumb--edited' : '');
        thumb.innerHTML =
          '<img src="' + photo.url + '" alt="Garden photo ' + (idx + 1) + '">' +
          '<span class="quote-photo-thumb__edit-badge">EDITED</span>' +
          '<button type="button" class="quote-photo-thumb__remove" data-idx="' + idx + '" aria-label="Remove">&times;</button>';
        thumb.addEventListener('click', function (e) {
          if (e.target.classList.contains('quote-photo-thumb__remove')) return;
          openEditor(idx);
        });
        thumb.querySelector('.quote-photo-thumb__remove').addEventListener('click', function (e) {
          e.stopPropagation();
          var idx = parseInt(this.getAttribute('data-idx'), 10);
          URL.revokeObjectURL(uploadedFiles[idx].url);
          uploadedFiles.splice(idx, 1);
          renderThumbs();
        });
        thumbsContainer.appendChild(thumb);
      });
    }

    function openEditor(idx) {
      if (idx < 0 || idx >= uploadedFiles.length) return;
      currentPhotoIdx = idx;
      var photo = uploadedFiles[idx];

      if (!photo.image) {
        var img = new Image();
        img.onload = function () {
          photo.image = img;
          renderEditorCanvas();
          editorModal.hidden = false;
          document.body.style.overflow = 'hidden';
        };
        img.src = photo.url;
      } else {
        renderEditorCanvas();
        editorModal.hidden = false;
        document.body.style.overflow = 'hidden';
      }

      updateCounter();
      updateNavButtons();
    }

    function updateCounter() {
      var counter = editorModal.querySelector('#editorCounter');
      if (counter) {
        counter.textContent = (currentPhotoIdx + 1) + ' of ' + uploadedFiles.length;
      }
    }

    function updateNavButtons() {
      var prevBtn = editorModal.querySelector('#editorPrev');
      var nextBtn = editorModal.querySelector('#editorNext');
      if (prevBtn) prevBtn.disabled = currentPhotoIdx <= 0;
      if (nextBtn) nextBtn.disabled = currentPhotoIdx >= uploadedFiles.length - 1;
      var hasMultiple = uploadedFiles.length > 1;
      if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    }

    function renderEditorCanvas() {
      var photo = uploadedFiles[currentPhotoIdx];
      if (!photo.image) return;

      var wrap = editorModal.querySelector('#editorCanvasWrap');
      var oldCanvas = wrap.querySelector('canvas');
      if (oldCanvas) oldCanvas.remove();

      editorCanvas = document.createElement('canvas');
      editorCanvas.className = 'photo-editor-modal__canvas';

      // Size: fit within viewport without stretching
      var wrapRect = wrap.getBoundingClientRect();
      var maxW = wrapRect.width - 32;
      var maxH = wrapRect.height - 32;
      var imgW = photo.image.width;
      var imgH = photo.image.height;
      var scale = Math.min(maxW / imgW, maxH / imgH, 1);
      if (scale < 0.1) scale = 0.1;
      editorCanvas.width = imgW * scale;
      editorCanvas.height = imgH * scale;

      wrap.appendChild(editorCanvas);
      editorCtx = editorCanvas.getContext('2d');

      redrawCanvas();
      wireCanvasDrawing();
    }

    function redrawCanvas() {
      var photo = uploadedFiles[currentPhotoIdx];
      if (!photo.image || !editorCtx) return;

      editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
      editorCtx.drawImage(photo.image, 0, 0, editorCanvas.width, editorCanvas.height);

      photo.strokes.forEach(function (stroke) {
        if (stroke.tool === 'pen' || stroke.tool === 'erase') {
          editorCtx.strokeStyle = stroke.tool === 'erase' ? 'rgba(0,0,0,1)' : stroke.color;
          editorCtx.lineWidth = stroke.tool === 'erase' ? 20 : 3;
          editorCtx.lineCap = 'round';
          editorCtx.lineJoin = 'round';
          if (stroke.tool === 'erase') {
            editorCtx.globalCompositeOperation = 'destination-out';
          } else {
            editorCtx.globalCompositeOperation = 'source-over';
          }
          editorCtx.beginPath();
          stroke.points.forEach(function (pt, i) {
            if (i === 0) editorCtx.moveTo(pt.x, pt.y);
            else editorCtx.lineTo(pt.x, pt.y);
          });
          editorCtx.stroke();
          editorCtx.globalCompositeOperation = 'source-over';
        } else if (stroke.tool === 'label') {
          editorCtx.font = '14px sans-serif';
          var text = stroke.text || 'Label';
          var metrics = editorCtx.measureText(text);
          var padX = 6, padY = 4;
          var boxW = metrics.width + padX * 2;
          var boxH = 20;
          editorCtx.fillStyle = stroke.color;
          editorCtx.fillRect(stroke.x - boxW / 2, stroke.y - boxH / 2, boxW, boxH);
          editorCtx.fillStyle = '#fff';
          editorCtx.textAlign = 'center';
          editorCtx.textBaseline = 'middle';
          editorCtx.fillText(text, stroke.x, stroke.y);
        }
      });
    }

    function wireCanvasDrawing() {
      if (!editorCanvas) return;
      var currentStroke = null;

      function getPos(e) {
        var rect = editorCanvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (editorCanvas.width / rect.width),
          y: (clientY - rect.top) * (editorCanvas.height / rect.height)
        };
      }

      function start(e) {
        e.preventDefault();
        var pos = getPos(e);
        var photo = uploadedFiles[currentPhotoIdx];

        if (currentTool === 'label') {
          var text = prompt('Enter label text:', 'Problem area');
          if (!text) return;
          photo.strokes.push({
            tool: 'label',
            color: currentColor,
            x: pos.x,
            y: pos.y,
            text: text
          });
          photo.edited = true;
          redrawCanvas();
          renderThumbs();
          return;
        }

        currentStroke = {
          tool: currentTool,
          color: currentColor,
          points: [pos]
        };
        photo.strokes.push(currentStroke);
        isDrawing = true;
      }

      function move(e) {
        if (!isDrawing || !currentStroke) return;
        e.preventDefault();
        var pos = getPos(e);
        currentStroke.points.push(pos);
        redrawCanvas();
      }

      function end() {
        if (isDrawing && currentStroke) {
          var photo = uploadedFiles[currentPhotoIdx];
          photo.edited = true;
          renderThumbs();
        }
        isDrawing = false;
        currentStroke = null;
      }

      editorCanvas.addEventListener('mousedown', start);
      editorCanvas.addEventListener('mousemove', move);
      editorCanvas.addEventListener('mouseup', end);
      editorCanvas.addEventListener('mouseleave', end);
      editorCanvas.addEventListener('touchstart', start, { passive: false });
      editorCanvas.addEventListener('touchmove', move, { passive: false });
      editorCanvas.addEventListener('touchend', end);
    }

    // Tool selection
    editorModal.querySelectorAll('.photo-editor-modal__tool[data-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tool = this.getAttribute('data-tool');
        currentTool = tool;
        editorModal.querySelectorAll('.photo-editor-modal__tool').forEach(function (b) {
          b.classList.remove('is-active');
        });
        this.classList.add('is-active');
      });
    });

    // Color selection
    editorModal.querySelectorAll('.photo-editor-modal__color').forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        currentColor = this.getAttribute('data-color');
        editorModal.querySelectorAll('.photo-editor-modal__color').forEach(function (s) {
          s.classList.remove('is-active');
        });
        this.classList.add('is-active');
      });
    });

    // Clear all
    editorModal.querySelector('[data-action="clear"]').addEventListener('click', function () {
      var photo = uploadedFiles[currentPhotoIdx];
      photo.strokes = [];
      photo.edited = false;
      redrawCanvas();
      renderThumbs();
    });

    // Close handlers
    editorModal.querySelector('#editorClose').addEventListener('click', closeEditor);
    editorModal.querySelector('#editorDone').addEventListener('click', closeEditor);
    editorModal.addEventListener('click', function (e) {
      if (e.target === editorModal) closeEditor();
    });

    function closeEditor() {
      editorModal.hidden = true;
      document.body.style.overflow = '';
      // Generate final canvas for each edited photo
      uploadedFiles.forEach(function (photo) {
        if (photo.edited && photo.image && !photo.finalCanvas) {
          var finalCanvas = document.createElement('canvas');
          finalCanvas.width = photo.image.width;
          finalCanvas.height = photo.image.height;
          var ctx = finalCanvas.getContext('2d');
          ctx.drawImage(photo.image, 0, 0);
          var scaleX = photo.image.width / editorCanvas.width;
          var scaleY = photo.image.height / editorCanvas.height;
          photo.strokes.forEach(function (stroke) {
            if (stroke.tool === 'pen' || stroke.tool === 'erase') {
              ctx.strokeStyle = stroke.tool === 'erase' ? 'rgba(0,0,0,1)' : stroke.color;
              ctx.lineWidth = (stroke.tool === 'erase' ? 20 : 3) * scaleX;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              if (stroke.tool === 'erase') {
                ctx.globalCompositeOperation = 'destination-out';
              } else {
                ctx.globalCompositeOperation = 'source-over';
              }
              ctx.beginPath();
              stroke.points.forEach(function (pt, i) {
                if (i === 0) ctx.moveTo(pt.x * scaleX, pt.y * scaleY);
                else ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
              });
              ctx.stroke();
              ctx.globalCompositeOperation = 'source-over';
            } else if (stroke.tool === 'label') {
              ctx.font = (14 * scaleX) + 'px sans-serif';
              var metrics = ctx.measureText(stroke.text);
              var padX = 6 * scaleX;
              var boxW = metrics.width + padX * 2;
              var boxH = 20 * scaleX;
              ctx.fillStyle = stroke.color;
              ctx.fillRect(stroke.x * scaleX - boxW / 2, stroke.y * scaleY - boxH / 2, boxW, boxH);
              ctx.fillStyle = '#fff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(stroke.text, stroke.x * scaleX, stroke.y * scaleY);
            }
          });
          photo.finalCanvas = finalCanvas;
        }
      });
    }

    // Navigation
    editorModal.querySelector('#editorPrev').addEventListener('click', function () {
      if (currentPhotoIdx > 0) openEditor(currentPhotoIdx - 1);
    });
    editorModal.querySelector('#editorNext').addEventListener('click', function () {
      if (currentPhotoIdx < uploadedFiles.length - 1) openEditor(currentPhotoIdx + 1);
    });

    // Handle window resize — re-render canvas to fit
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (editorModal.hidden) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderEditorCanvas, 200);
    });

    // Intercept form submit to include edited photos
    form.addEventListener('submit', function () {
      try {
        var dt = new DataTransfer();
        var pending = uploadedFiles.length;
        uploadedFiles.forEach(function (photo) {
          if (photo.finalCanvas) {
            photo.finalCanvas.toBlob(function (blob) {
              var editedFile = new File([blob], photo.file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '-edited.jpg'), { type: 'image/jpeg' });
              dt.items.add(editedFile);
              pending--;
              if (pending === 0) {
                var originalInput = document.getElementById('photos');
                if (originalInput) originalInput.files = dt.files;
              }
            }, 'image/jpeg', 0.92);
          } else {
            dt.items.add(photo.file);
            pending--;
            if (pending === 0) {
              var orig = document.getElementById('photos');
              if (orig) orig.files = dt.files;
            }
          }
        });
      } catch (err) {}
    }, true);
  }

  ready(function () {
    wireUnifiedPhotoUpload();
  });

  window.CGMv9 = { wireUnifiedPhotoUpload: wireUnifiedPhotoUpload };
})();
