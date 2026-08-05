/* ==========================================================================
   CGM v9 Enhancements — Round-5 behaviour layer
   Issues: 1 (unified photo upload + editor), 4 (floating category nav +
   hover scroll-jam fix), 9 (compare modal MutationObserver fix).
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ----- ISSUE 1: Unified photo upload + full-screen editor -----
     Replaces the two-step upload + advanced disclosure with a single
     upload zone at the top of the form. On file selection, the editor
     opens full-screen with a side toolbar (pen / label / erase / colors).
     Works on both mobile and desktop. ----- */
  function wireUnifiedPhotoUpload() {
    var form = document.getElementById('quoteForm');
    if (!form) return;
    if (form.dataset.unifiedPhotoWired === 'true') return;
    form.dataset.unifiedPhotoWired = 'true';

    // Find the existing photo upload step
    var oldUploadStep = form.querySelector('.calc-step:has(#photos)');
    if (!oldUploadStep) {
      // Fallback: find by the file-upload label
      oldUploadStep = form.querySelector('.quote-photo-upload')?.closest('.calc-step');
    }
    if (!oldUploadStep) return;

    // Also find the advanced disclosure step (to hide it)
    var advancedStep = form.querySelector('.quote-advanced')?.closest('.calc-step');

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
    var uploadedFiles = []; // {file, url, canvas, edited}

    // Create the full-screen editor modal
    var editorModal = document.createElement('div');
    editorModal.className = 'photo-editor-modal';
    editorModal.hidden = true;
    editorModal.innerHTML =
      '<div class="photo-editor-modal__header">' +
        '<div><h3 class="photo-editor-modal__title">Edit photo</h3><p class="photo-editor-modal__hint" id="editorToolHint">Pen — click and drag to mark an area.</p></div>' +
        '<span class="photo-editor-modal__counter" id="editorCounter">1 of 1</span>' +
        '<button type="button" class="photo-editor-modal__close" id="editorClose" aria-label="Close photo editor" title="Close photo editor">&times;</button>' +
      '</div>' +
      '<div class="photo-editor-modal__body">' +
        '<div class="photo-editor-modal__canvas-wrap" id="editorCanvasWrap">' +
          '<button type="button" class="photo-editor-modal__nav photo-editor-modal__nav--prev" id="editorPrev" aria-label="Previous photo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
          '<button type="button" class="photo-editor-modal__nav photo-editor-modal__nav--next" id="editorNext" aria-label="Next photo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
        '</div>' +
        '<div class="photo-editor-modal__toolbar">' +
          '<button type="button" class="photo-editor-modal__tool is-active" data-tool="pen" title="Draw a freehand mark" aria-label="Pen — draw a freehand mark" aria-pressed="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' +
            '<span class="photo-editor-modal__tool-label">Pen</span>' +
          '</button>' +
          '<button type="button" class="photo-editor-modal__tool" data-tool="label" title="Place a text label" aria-label="Label — place a text label" aria-pressed="false">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"/><path d="M7 10h10"/></svg>' +
            '<span class="photo-editor-modal__tool-label">Label</span>' +
          '</button>' +
          '<button type="button" class="photo-editor-modal__tool" data-tool="erase" title="Remove a mark or label" aria-label="Eraser — remove a mark or label" aria-pressed="false">' +
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
          '<button type="button" class="photo-editor-modal__tool" data-action="clear" title="Remove every annotation and keep the photo" aria-label="Clear all annotations and keep the photo">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
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
    var strokes = []; // per-photo: uploadedFiles[i].strokes = [{tool, color, points: [{x,y}]}]

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
      // Auto-open the editor for the first new photo
      openEditor(uploadedFiles.length - files.length);
      // Reset input so the same file can be re-selected
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
          '<button type="button" class="quote-photo-thumb__remove" data-idx="' + idx + '" aria-label="Remove photo">&times;</button>';
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

      // Show the modal FIRST so the browser can lay it out and the canvas
      // wrap gets a real clientWidth/clientHeight. On mobile, calling
      // renderEditorCanvas() while the modal is still hidden produced
      // clientHeight=0, which led to negative canvas dimensions, which
      // fell back to the default 300x150 and stretched the photo.
      editorModal.hidden = false;
      document.body.style.overflow = 'hidden';
      updateCounter();
      updateNavButtons();

      function loadAndRender() {
        if (!photo.image) {
          var img = new Image();
          img.onload = function () {
            photo.image = img;
            // Wait one more frame for layout to settle on mobile before
            // measuring the canvas wrap.
            requestAnimationFrame(renderEditorCanvas);
          };
          img.src = photo.url;
        } else {
          requestAnimationFrame(renderEditorCanvas);
        }
      }

      // Wait for the next frame so the modal is visible and has dimensions.
      requestAnimationFrame(loadAndRender);
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
      // Hide nav if only one photo
      var hasMultiple = uploadedFiles.length > 1;
      if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    }

    function renderEditorCanvas() {
      var photo = uploadedFiles[currentPhotoIdx];
      if (!photo.image) return;

      var wrap = editorModal.querySelector('#editorCanvasWrap');
      // Remove old canvas
      var oldCanvas = wrap.querySelector('canvas');
      if (oldCanvas) oldCanvas.remove();

      editorCanvas = document.createElement('canvas');
      editorCanvas.className = 'photo-editor-modal__canvas';

      // Size: fit within viewport. Guard against zero/negative dimensions
      // (which happened on mobile when the modal hadn't been laid out yet,
      // causing the canvas to fall back to 300x150 and stretch the photo).
      var imgW = photo.image.width || 1;
      var imgH = photo.image.height || 1;
      var maxW = Math.max(64, wrap.clientWidth - 32);
      var maxH = Math.max(64, wrap.clientHeight - 32);
      var scale = Math.min(maxW / imgW, maxH / imgH, 1);
      // Guard: if scale is not a positive finite number, use a safe default.
      if (!isFinite(scale) || scale <= 0) scale = 0.1;
      editorCanvas.width = Math.max(1, Math.round(imgW * scale));
      editorCanvas.height = Math.max(1, Math.round(imgH * scale));

      wrap.appendChild(editorCanvas);
      editorCtx = editorCanvas.getContext('2d');

      // Draw image + strokes
      redrawCanvas();

      // Wire up drawing
      wireCanvasDrawing();
      updateToolHint(currentTool);

      // On mobile the modal may still be settling. If the canvas wrap has
      // grown since we sized the canvas, re-render once after the next frame.
      var measuredW = maxW;
      var measuredH = maxH;
      requestAnimationFrame(function () {
        var newW = Math.max(64, wrap.clientWidth - 32);
        var newH = Math.max(64, wrap.clientHeight - 32);
        if (Math.abs(newW - measuredW) > 8 || Math.abs(newH - measuredH) > 8) {
          renderEditorCanvas();
        }
      });
    }

    function redrawCanvas() {
      var photo = uploadedFiles[currentPhotoIdx];
      if (!photo.image || !editorCtx) return;

      editorCtx.drawImage(photo.image, 0, 0, editorCanvas.width, editorCanvas.height);

      // Draw saved annotations. Eraser actions deliberately are not stored as
      // canvas strokes: removing image pixels creates transparent/black marks
      // when an edited photograph is exported to JPEG.
      photo.strokes.forEach(function (stroke) {
        if (stroke.tool === 'pen') {
          editorCtx.strokeStyle = stroke.color;
          editorCtx.lineWidth = 3;
          editorCtx.lineCap = 'round';
          editorCtx.lineJoin = 'round';
          editorCtx.globalCompositeOperation = 'source-over';
          editorCtx.beginPath();
          stroke.points.forEach(function (pt, i) {
            if (i === 0) editorCtx.moveTo(pt.x, pt.y);
            else editorCtx.lineTo(pt.x, pt.y);
          });
          editorCtx.stroke();
          editorCtx.globalCompositeOperation = 'source-over';
        } else if (stroke.tool === 'label') {
          // Draw label as text with background
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

    function distanceToSegment(point, start, end) {
      var dx = end.x - start.x;
      var dy = end.y - start.y;
      if (dx === 0 && dy === 0) {
        return Math.hypot(point.x - start.x, point.y - start.y);
      }
      var t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
    }

    function eraseAnnotationAt(photo, point) {
      var hitRadius = 20;
      for (var i = photo.strokes.length - 1; i >= 0; i--) {
        var stroke = photo.strokes[i];
        var hit = false;
        if (stroke.tool === 'label') {
          hit = Math.hypot(point.x - stroke.x, point.y - stroke.y) <= 40;
        } else if (stroke.tool === 'pen' && stroke.points && stroke.points.length) {
          for (var j = 0; j < stroke.points.length; j++) {
            var start = stroke.points[j];
            var end = stroke.points[j + 1] || start;
            if (distanceToSegment(point, start, end) <= hitRadius) {
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          photo.strokes.splice(i, 1);
          return true;
        }
      }
      return false;
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
          // Prompt for label text
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

        if (currentTool === 'erase') {
          if (eraseAnnotationAt(photo, pos)) {
            photo.edited = photo.strokes.length > 0;
            redrawCanvas();
            renderThumbs();
          }
          return;
        }

        currentStroke = {
          tool: 'pen',
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

      // Mouse
      editorCanvas.addEventListener('mousedown', start);
      editorCanvas.addEventListener('mousemove', move);
      editorCanvas.addEventListener('mouseup', end);
      editorCanvas.addEventListener('mouseleave', end);

      // Touch
      editorCanvas.addEventListener('touchstart', start, { passive: false });
      editorCanvas.addEventListener('touchmove', move, { passive: false });
      editorCanvas.addEventListener('touchend', end);
    }

    function updateToolHint(tool) {
      var messages = {
        pen: 'Pen — click and drag to mark an area.',
        label: 'Label — click the image to place a short note.',
        erase: 'Eraser — click a mark or label to remove it. Your photo stays untouched.'
      };
      var hint = editorModal.querySelector('#editorToolHint');
      if (hint) hint.textContent = messages[tool] || messages.pen;
      if (editorCanvas) editorCanvas.style.cursor = tool === 'erase' ? 'not-allowed' : (tool === 'label' ? 'copy' : 'crosshair');
    }

    // Tool selection
    editorModal.querySelectorAll('.photo-editor-modal__tool[data-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tool = this.getAttribute('data-tool');
        currentTool = tool;
        editorModal.querySelectorAll('.photo-editor-modal__tool').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-pressed', 'true');
        updateToolHint(tool);
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

    // Close
    editorModal.querySelector('#editorClose').addEventListener('click', closeEditor);
    editorModal.addEventListener('click', function (e) {
      if (e.target === editorModal) closeEditor();
    });

    function closeEditor() {
      editorModal.hidden = true;
      document.body.style.overflow = '';
      // Generate final canvas for each edited photo (for form submission)
      uploadedFiles.forEach(function (photo) {
        if (photo.edited && photo.image) {
          // Create a final canvas at full resolution
          var finalCanvas = document.createElement('canvas');
          finalCanvas.width = photo.image.width;
          finalCanvas.height = photo.image.height;
          var ctx = finalCanvas.getContext('2d');
          ctx.drawImage(photo.image, 0, 0);
          // Scale strokes from editor canvas to full res
          var scaleX = photo.image.width / editorCanvas.width;
          var scaleY = photo.image.height / editorCanvas.height;
          photo.strokes.forEach(function (stroke) {
            if (stroke.tool === 'pen') {
              ctx.strokeStyle = stroke.color;
              ctx.lineWidth = 3 * scaleX;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.globalCompositeOperation = 'source-over';
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

    // Intercept form submit to include edited photos.
    // toBlob() is async, so we MUST synchronously prevent the default submit,
    // wait for ALL blobs to finish, then re-trigger submit programmatically.
    var submitInProgress = false;
    form.addEventListener('submit', function (e) {
      if (submitInProgress) {
        // This is our programmatic re-submit after blobs finished - let it through.
        return;
      }
      // Check whether any photo actually has an edited canvas - if not, skip the dance.
      var hasEdited = uploadedFiles.some(function (p) { return !!p.finalCanvas; });
      if (!hasEdited) {
        return; // let the browser submit normally with the original file input
      }
      e.preventDefault();
      submitInProgress = true;
      try {
        var dt = new DataTransfer();
        var pending = uploadedFiles.length;
        function doneOne() {
          pending -= 1;
          if (pending > 0) return;
          var originalInput = document.getElementById('photos');
          if (originalInput) {
            try { originalInput.files = dt.files; } catch (e2) { /* some browsers reject assignment */ }
          }
          // Re-trigger submit synchronously
          // Use requestAnimationFrame so the file input update is committed first.
          requestAnimationFrame(function () {
            if (typeof form.requestSubmit === 'function') {
              form.requestSubmit();
            } else {
              form.submit();
            }
          });
        }
        uploadedFiles.forEach(function (photo) {
          if (photo.finalCanvas) {
            try {
              photo.finalCanvas.toBlob(function (blob) {
                if (blob) {
                  var editedFile = new File([blob], photo.file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '-edited.jpg'), { type: 'image/jpeg' });
                  dt.items.add(editedFile);
                } else {
                  dt.items.add(photo.file);
                }
                doneOne();
              }, 'image/jpeg', 0.92);
            } catch (err) {
              dt.items.add(photo.file);
              doneOne();
            }
          } else {
            dt.items.add(photo.file);
            doneOne();
          }
        });
      } catch (err) {
        // Fallback: re-trigger submit with original files
        submitInProgress = false;
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.submit();
        }
      }
    }, true);
  }

  /* ----- ISSUE 4: Floating category nav + fix hover scroll-jam -----
     Add large floating left/right arrows on desktop. Remove the tilt
     pointermove handler that causes the card to "stick" and prevent
     page scrolling. ----- */
  function wireFloatingCategoryNav() {
    var tipSections = document.querySelectorAll('.tip-category-section');
    if (!tipSections.length) return;
    if (window.matchMedia('(max-width: 768px)').matches) return; // desktop only
    if (document.querySelector('.tip-floating-nav')) return; // already added

    // Remove the cgm-tilt class from tip cards to prevent scroll-jam
    document.querySelectorAll('.tip-card.editorial-row').forEach(function (card) {
      card.classList.remove('cgm-tilt');
      card.removeAttribute('data-tilt');
      card.dataset.tiltReady = 'true'; // prevent card-tilt.js from re-attaching
      card.style.willChange = 'auto';
    });

    // Create floating left arrow
    var leftNav = document.createElement('div');
    leftNav.className = 'tip-floating-nav tip-floating-nav--left';
    leftNav.innerHTML =
      '<button type="button" class="tip-floating-nav__btn tip-floating-nav__btn--prev" aria-label="Previous category">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
      '</button>';
    document.body.appendChild(leftNav);

    // Create floating right arrow
    var rightNav = document.createElement('div');
    rightNav.className = 'tip-floating-nav tip-floating-nav--right';
    rightNav.innerHTML =
      '<button type="button" class="tip-floating-nav__btn tip-floating-nav__btn--next" aria-label="Next category">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
      '</button>';
    document.body.appendChild(rightNav);

    var prevBtn = leftNav.querySelector('button');
    var nextBtn = rightNav.querySelector('button');
    var currentIdx = 0;

    function updateNav() {
      prevBtn.disabled = currentIdx <= 0;
      nextBtn.disabled = currentIdx >= tipSections.length - 1;
      // Show/hide floating navs based on scroll position
      var firstSection = tipSections[0];
      var lastSection = tipSections[tipSections.length - 1];
      var firstRect = firstSection.getBoundingClientRect();
      var lastRect = lastSection.getBoundingClientRect();
      var inRange = lastRect.top > 100 && firstRect.bottom < window.innerHeight;
      leftNav.style.display = inRange ? 'flex' : 'none';
      rightNav.style.display = inRange ? 'flex' : 'none';
    }

    function scrollToSection(idx) {
      if (idx < 0 || idx >= tipSections.length) return;
      currentIdx = idx;
      var target = tipSections[idx];
      var headerHeight = 70;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: top, behavior: 'smooth' });
      updateNav();
    }

    prevBtn.addEventListener('click', function () { scrollToSection(currentIdx - 1); });
    nextBtn.addEventListener('click', function () { scrollToSection(currentIdx + 1); });

    // Update current index based on scroll position
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var viewportMid = window.innerHeight / 2;
        var bestIdx = 0;
        var bestDist = Infinity;
        tipSections.forEach(function (section, idx) {
          var rect = section.getBoundingClientRect();
          var center = rect.top + rect.height / 2;
          var dist = Math.abs(center - viewportMid);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        if (bestIdx !== currentIdx) {
          currentIdx = bestIdx;
        }
        updateNav();
      }, 100);
    }, { passive: true });

    updateNav();
  }

  /* ----- ISSUE 9: Compare modal — ensure body class toggles reliably ----- */
  function wireCompareModalClassReliable() {
    var modal = document.getElementById('compareModal');
    if (!modal) return;

    // Check initial state
    document.body.classList.toggle('compare-modal-open', !modal.hidden);

    // Watch the hidden attribute
    var observer = new MutationObserver(function () {
      document.body.classList.toggle('compare-modal-open', !modal.hidden);
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });

    // Also intercept the show/hide functions directly
    var origShow = window.showCompareModal;
    var origHide = window.hideCompareModal;

    // Patch the modal's hidden property setter
    var origHidden = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidden');
    Object.defineProperty(modal, 'hidden', {
      get: function () { return origHidden.get.call(this); },
      set: function (val) {
        origHidden.set.call(this, val);
        document.body.classList.toggle('compare-modal-open', !val);
      },
      configurable: true
    });
  }

  /* ----- Run all on ready ----- */
  ready(function () {
    wireUnifiedPhotoUpload();
    wireFloatingCategoryNav();
    wireCompareModalClassReliable();

    // Re-run on resize
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        wireFloatingCategoryNav();
      }, 300);
    });
  });

  // Expose
  window.CGMv9 = {
    wireUnifiedPhotoUpload: wireUnifiedPhotoUpload,
    wireFloatingCategoryNav: wireFloatingCategoryNav,
    wireCompareModalClassReliable: wireCompareModalClassReliable
  };
})();
