/* CGM Coverage Atlas V2.1 - Landscape Renderer with State Events
 * Uses 1200×760 SVG coordinate space with EPSG:3857 projection.
 *
 * Includes:
 *   - cgm:map-state event system
 *   - cgm:map-ready event after hash restoration
 *   - Grouped SVG structure (geoLayer / interactiveLayer)
 *   - Delegated click + keydown handlers
 *   - Inverse marker scaling for clusters/towns/user-loc
 *   - classifySVGPoint using SVG isPointInFill (no arbitrary thresholds)
 *   - CGMMap API: focusTown, showUserLocation, reset, getState, classifyLocation
 *   - Outside-area wash mask using combinedSilhouette (visual focus)
 */

(function () {
  "use strict";

  var D = window.CGM_MAP_DATA;
  if (!D) { console.error("CGM Map: map-data.js not loaded"); return; }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var OW = D.overview.width, OH = D.overview.height;
  var CLUSTERS = D.clusters, TOWNS = D.towns, COUNTIES = D.counties;
  var REG = D.regularCoverage, EXT = D.extendedCoverage, GEO = D.geoTransform;
  var SILHOUETTE = D.combinedSilhouette;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = { cluster: null, town: null, zoom: 1, panX: 0, panY: 0 };
  var svg, viewport, geoLayer, interactiveLayer, backBtn, infoPanel, infoName, infoCount, animFrame = null;
  var mapStatusText;

  function el(tag, attrs, text) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function latlngToSVG(lat, lng) {
    var R = 6378137.0;
    var mercX = lng * Math.PI / 180 * R;
    var mercY = Math.log(Math.tan(Math.PI/4 + lat * Math.PI / 360)) * R;
    var ext = GEO.extent;
    var svgX = ((mercX - ext[0]) / (ext[2] - ext[0])) * GEO.svgWidth;
    var svgY = ((ext[3] - mercY) / (ext[3] - ext[1])) * GEO.svgHeight;
    return [svgX, svgY];
  }

  // --- Coverage classification via SVG geometry (no arbitrary thresholds) ---

  function classifySVGPoint(x, y) {
    var point = new DOMPoint(x, y);

    var regularPath = geoLayer.querySelector(
      ".coverage-atlas__region--regular"
    );

    var extendedPath = geoLayer.querySelector(
      ".coverage-atlas__region--extended"
    );

    if (
      regularPath &&
      typeof regularPath.isPointInFill === "function" &&
      regularPath.isPointInFill(point)
    ) {
      return "regular";
    }

    if (
      extendedPath &&
      typeof extendedPath.isPointInFill === "function" &&
      extendedPath.isPointInFill(point)
    ) {
      return "extended";
    }

    return "outside";
  }

  function emitMapState(mode, detail) {
    document.dispatchEvent(new CustomEvent("cgm:map-state", {
      detail: Object.assign({ mode: mode, cluster: state.cluster, town: state.town, zoom: state.zoom }, detail || {})
    }));
  }

  function applyTransform() {
    // Clamp pan so the map content never deviates into white space.
    // At zoom=1, pan must be 0. At higher zoom, allow pan up to the
    // edge of the visible content so no white border shows.
    var maxPanX = Math.max(0, (state.zoom - 1) * OW / 2);
    var maxPanY = Math.max(0, (state.zoom - 1) * OH / 2);
    state.panX = Math.max(-maxPanX, Math.min(maxPanX, state.panX));
    state.panY = Math.max(-maxPanY, Math.min(maxPanY, state.panY));

    viewport.setAttribute("transform",
      "translate(" + (OW/2 + state.panX) + "," + (OH/2 + state.panY) + ") " +
      "scale(" + state.zoom + ") " +
      "translate(" + (-OW/2) + "," + (-OH/2) + ")");
    var invScale = 1 / state.zoom;
    viewport.querySelectorAll(".coverage-atlas__cluster, .coverage-atlas__town, .coverage-atlas__user-loc").forEach(function(g) {
      var t = g.getAttribute("data-transform") || g.getAttribute("transform") || "";
      var match = t.match(/translate\(([^,]+),([^)]+)\)/);
      if (match) {
        var x = parseFloat(match[1]), y = parseFloat(match[2]);
        g.setAttribute("transform", "translate(" + x + "," + y + ") scale(" + invScale + ")");
      }
    });
  }

  function animateZoom(targetZoom, targetPanX, targetPanY, dur) {
    if (animFrame) cancelAnimationFrame(animFrame);
    // Clamp target zoom to [1, 8] - never below 1 (no white space)
    targetZoom = Math.max(1, Math.min(8, targetZoom));
    if (reducedMotion) { state.zoom = targetZoom; state.panX = targetPanX; state.panY = targetPanY; applyTransform(); checkOverviewRestore(); return; }
    var sZ = state.zoom, sX = state.panX, sY = state.panY, t0 = null;
    dur = dur || 200;
    function ease(t) { return 1 - Math.pow(1-t, 3); }
    function step(ts) {
      if (!t0) t0 = ts;
      var t = Math.min((ts-t0)/dur, 1), e = ease(t);
      state.zoom = sZ + (targetZoom-sZ)*e;
      state.panX = sX + (targetPanX-sX)*e;
      state.panY = sY + (targetPanY-sY)*e;
      applyTransform();
      if (t < 1) animFrame = requestAnimationFrame(step);
      else { animFrame = null; checkOverviewRestore(); }
    }
    animFrame = requestAnimationFrame(step);
  }

  // V2.2: When zooming out to ~1.5 (half zoom level) while in cluster view,
  // automatically restore the cluster numbers so the user sees the overview again.
  // User requested: only zoom out to half the distance, not all the way to 1.0.
  var OVERVIEW_RESTORE_ZOOM = 1.5;

  function checkOverviewRestore() {
    if (state.cluster && state.zoom <= OVERVIEW_RESTORE_ZOOM) {
      // Zoomed back to half level - restore clusters
      state.cluster = null;
      state.town = null;
      state.zoom = 1;
      state.panX = 0;
      state.panY = 0;
      renderOverview();
      backBtn.hidden = true;
      if (infoPanel) infoPanel.hidden = true;
      if (mapStatusText) mapStatusText.textContent = "CGM regular and extended coverage";
    }
  }

  // Zoom toward a focal point (SVG coordinates) - used by wheel and pinch zoom
  function zoomToFocal(focalSvgX, focalSvgY, factor) {
    if (animFrame) cancelAnimationFrame(animFrame);
    var newZoom = Math.max(1, Math.min(8, state.zoom * factor));
    if (newZoom === state.zoom) return;
    // The SVG point under the cursor before zoom should remain under the cursor after zoom.
    // Convert focal point to screen coordinates (relative to center)
    var screenX = focalSvgX - OW/2;
    var screenY = focalSvgY - OH/2;
    // After zoom, the pan needs to shift so the focal point stays put
    var ratio = newZoom / state.zoom;
    state.panX = screenX - (screenX - state.panX) * ratio;
    state.panY = screenY - (screenY - state.panY) * ratio;
    state.zoom = newZoom;
    applyTransform();
    checkOverviewRestore();
  }

  // Convert a screen (client) position to SVG coordinates
  function clientToSvg(clientX, clientY) {
    var rect = svg.getBoundingClientRect();
    var x = ((clientX - rect.left) / rect.width) * OW;
    var y = ((clientY - rect.top) / rect.height) * OH;
    return [x, y];
  }

  function clusterBounds(cluster) {
    var xs = cluster.towns.map(function(t){return t.x;}), ys = cluster.towns.map(function(t){return t.y;});
    var minX=Math.min.apply(null,xs), maxX=Math.max.apply(null,xs), minY=Math.min.apply(null,ys), maxY=Math.max.apply(null,ys);
    return [minX, minY, maxX, maxY];
  }

  function zoomToBounds(bounds) {
    var w = bounds[2]-bounds[0], h = bounds[3]-bounds[1];
    var cx = (bounds[0]+bounds[2])/2, cy = (bounds[1]+bounds[3])/2;
    var pad = Math.max(w, h) * 0.3 || 80;
    var bw = w + pad*2, bh = h + pad*2;
    var z = Math.min(OW / bw, OH / bh, 6);
    z = Math.max(z, 1.5);
    var px = (OW/2 - cx) * z, py = (OH/2 - cy) * z;
    animateZoom(z, px, py, 200);
  }

  function renderOverview() {
    interactiveLayer.innerHTML = "";

    // Basemap
    var basemap = el("image", {
      href: "/chilterngardenmaintenance-updatedsite/images/maps/cgm-coverage-basemap.webp",
      x: 0, y: 0, width: OW, height: OH,
      preserveAspectRatio: "none",
      class: "coverage-atlas__basemap",
      "pointer-events": "none"
    });

    // Clear geography layer and rebuild
    geoLayer.innerHTML = "";
    geoLayer.appendChild(basemap);

    // Outside-area wash mask: keeps roads visible outside the covered region
    // while making the covered region the clear focal point.
    if (SILHOUETTE && SILHOUETTE.path) {
      var defs = el("defs");
      var mask = el("mask", { id: "cgmCoverageFocusMask" });
      mask.appendChild(el("rect", {
        x: 0, y: 0, width: OW, height: OH,
        fill: "#fff"
      }));
      mask.appendChild(el("path", {
        d: SILHOUETTE.path,
        fill: "#000"
      }));
      defs.appendChild(mask);
      geoLayer.appendChild(defs);

      geoLayer.appendChild(el("rect", {
        x: 0, y: 0, width: OW, height: OH,
        class: "coverage-atlas__outside-wash",
        mask: "url(#cgmCoverageFocusMask)"
      }));
    }

    geoLayer.appendChild(el("path", { d: REG.path, class: "coverage-atlas__region coverage-atlas__region--regular" }));
    geoLayer.appendChild(el("path", { d: EXT.path, class: "coverage-atlas__region coverage-atlas__region--extended" }));
    COUNTIES.forEach(function(c) {
      geoLayer.appendChild(el("path", { d: c.path, class: "coverage-atlas__boundary" }));
    });

    // Clusters in interactive layer
    CLUSTERS.forEach(function(cluster) {
      var g = el("g", {
        class: "coverage-atlas__cluster",
        "data-cluster": cluster.id,
        "data-transform": "translate(" + cluster.x + "," + cluster.y + ")",
        transform: "translate(" + cluster.x + "," + cluster.y + ")",
        tabindex: "0", role: "button",
        "aria-label": cluster.name + ", " + cluster.count + " towns"
      });
      g.appendChild(el("circle", {
        r: 23, class: "coverage-atlas__cluster-circle" + (cluster.coverage === "extended" ? " coverage-atlas__cluster-circle--extended" : "")
      }));
      g.appendChild(el("text", { y: 1, class: "coverage-atlas__cluster-count" }, String(cluster.count)));
      g.appendChild(el("text", { y: 38, class: "coverage-atlas__cluster-label" }, cluster.name));
      interactiveLayer.appendChild(g);
    });

    if (mapStatusText) mapStatusText.textContent = "CGM regular and extended coverage";
    emitMapState("overview");
  }

  function renderClusterTowns(cluster) {
    interactiveLayer.querySelectorAll(".coverage-atlas__cluster").forEach(function(g) { g.remove(); });
    cluster.towns.forEach(function(t) {
      var g = el("g", {
        class: "coverage-atlas__town" + (t.slug === state.town ? " is-selected" : ""),
        "data-slug": t.slug,
        "data-transform": "translate(" + t.x + "," + t.y + ")",
        transform: "translate(" + t.x + "," + t.y + ")",
        tabindex: "0", role: "button",
        "aria-label": t.name
      });
      g.appendChild(el("circle", { r: 6, class: "coverage-atlas__town-dot" }));
      g.appendChild(el("text", { y: -12, class: "coverage-atlas__town-label" }, t.name));
      interactiveLayer.appendChild(g);
    });
  }

  function focusCluster(clusterId) {
    var cluster = CLUSTERS.find(function(c) { return c.id === clusterId; });
    if (!cluster) return;
    state.cluster = clusterId;
    zoomToBounds(clusterBounds(cluster));
    renderClusterTowns(cluster);
    backBtn.hidden = false;
    if (infoName) infoName.textContent = cluster.name;
    if (infoCount) infoCount.textContent = cluster.count + " towns";
    if (infoPanel) infoPanel.hidden = false;
    if (mapStatusText) mapStatusText.textContent = "Viewing " + cluster.name + " area";
    emitMapState("cluster", { clusterData: cluster });
  }

  function reset() {
    state.cluster = null; state.town = null;
    animateZoom(1, 0, 0, 200);
    renderOverview();           // emits "overview" once
    backBtn.hidden = true;
    if (infoPanel) infoPanel.hidden = true;
    // NOTE: do NOT emit a duplicate overview event here.
  }

  function focusTown(slug) {
    state.town = slug;
    var town = TOWNS.find(function(t) { return t.slug === slug; });
    var cluster = CLUSTERS.find(function(c) { return c.towns.some(function(t) { return t.slug === slug; }); });
    if (!cluster) return;
    if (state.cluster !== cluster.id) {
      focusCluster(cluster.id);
      selectTownMarker(slug);
    } else {
      selectTownMarker(slug);
    }
    if (mapStatusText) mapStatusText.textContent = (town ? town.name : slug) + " selected";
    emitMapState("town", { townData: town, clusterData: cluster });
  }

  function selectTownMarker(slug) {
    interactiveLayer.querySelectorAll(".coverage-atlas__town").forEach(function(g) {
      if (g.getAttribute("data-slug") === slug) {
        g.classList.add("is-selected");
        var c = g.querySelector("circle");
        if (c) { c.setAttribute("r", "8"); c.style.fill = "#c8a45e"; }
      } else {
        g.classList.remove("is-selected");
        var d = g.querySelector("circle");
        if (d) { d.setAttribute("r", "6"); d.style.fill = ""; }
      }
    });
  }

  function showUserLocation(lat, lng) {
    var xy = latlngToSVG(lat, lng);
    var nearest = null, minD = Infinity;
    TOWNS.forEach(function(t) {
      var d = Math.sqrt((t.x-xy[0])*(t.x-xy[0]) + (t.y-xy[1])*(t.y-xy[1]));
      if (d < minD) { minD = d; nearest = t; }
    });
    if (state.cluster) {
      state.cluster = null; state.town = null;
      renderOverview();
      backBtn.hidden = true;
      if (infoPanel) infoPanel.hidden = true;
      animateZoom(1, 0, 0, 200);
    }
    var existing = interactiveLayer.querySelector(".coverage-atlas__user-loc");
    if (existing) existing.remove();
    var existingLine = interactiveLayer.querySelector(".coverage-atlas__user-line");
    if (existingLine) existingLine.remove();
    if (nearest) {
      interactiveLayer.appendChild(el("line", {
        x1: xy[0], y1: xy[1], x2: nearest.x, y2: nearest.y,
        stroke: "#4A90D9", "stroke-width": 1.5, "stroke-dasharray": "4,3",
        opacity: "0.5", class: "coverage-atlas__user-line"
      }));
    }
    var g = el("g", { class: "coverage-atlas__user-loc", "data-transform": "translate(" + xy[0] + "," + xy[1] + ")", transform: "translate(" + xy[0] + "," + xy[1] + ")" });
    g.appendChild(el("circle", { r: 8, fill: "#4A90D9", stroke: "#fff", "stroke-width": 2.5 }));
    g.appendChild(el("text", { y: -14, class: "coverage-atlas__town-label", style: "fill:#4A90D9" }, "Your location"));
    interactiveLayer.appendChild(g);
    applyTransform();

    // Coverage classification via SVG geometry
    var coverage = classifySVGPoint(xy[0], xy[1]);

    if (mapStatusText) mapStatusText.textContent = "Showing your nearest coverage";
    emitMapState("location", {
      latitude: lat,
      longitude: lng,
      svgX: xy[0],
      svgY: xy[1],
      coverage: coverage,
      nearestTown: nearest
    });

    return {
      latitude: lat,
      longitude: lng,
      svgX: xy[0],
      svgY: xy[1],
      coverage: coverage,
      nearestTown: nearest
    };
  }

  function onMapClick(e) {
    var target = e.target.closest(".coverage-atlas__cluster, .coverage-atlas__town");
    if (!target) return;
    if (target.classList.contains("coverage-atlas__cluster")) {
      focusCluster(target.getAttribute("data-cluster"));
    } else if (target.classList.contains("coverage-atlas__town")) {
      var slug = target.getAttribute("data-slug");
      if (typeof selectTown === "function") selectTown(slug, "map");
      else focusTown(slug);
    }
  }

  function onMapKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var target = e.target.closest(".coverage-atlas__cluster, .coverage-atlas__town");
    if (!target) return;
    e.preventDefault();
    if (target.classList.contains("coverage-atlas__cluster")) {
      focusCluster(target.getAttribute("data-cluster"));
    } else if (target.classList.contains("coverage-atlas__town")) {
      var slug = target.getAttribute("data-slug");
      if (typeof selectTown === "function") selectTown(slug, "map");
      else focusTown(slug);
    }
  }

  function init() {
    svg = document.getElementById("svgMapCanvas");
    var countiesG = document.getElementById("svgMapCounties");
    backBtn = document.getElementById("svgMapBack");
    infoPanel = document.getElementById("svgMapInfo");
    infoName = document.getElementById("svgMapInfoName");
    infoCount = document.getElementById("svgMapInfoCount");

    if (!svg || !countiesG) { console.error("CGM Map: SVG elements not found"); return; }

    svg.setAttribute("viewBox", "0 0 " + OW + " " + OH);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Build grouped structure
    countiesG.innerHTML = "";
    viewport = el("g", { id: "cgmMapViewport" });
    geoLayer = el("g", { id: "cgmMapGeography" });
    interactiveLayer = el("g", { id: "cgmMapInteractive" });
    viewport.appendChild(geoLayer);
    viewport.appendChild(interactiveLayer);
    countiesG.appendChild(viewport);

    renderOverview();
    applyTransform();

    // Map status bar
    var mapShell = document.querySelector(".location-map-shell");
    if (mapShell) {
      var status = document.createElement("div");
      status.className = "coverage-atlas__map-status";
      status.innerHTML = '<span class="coverage-atlas__map-status-dot"></span><span id="mapStatusText">CGM regular and extended coverage</span>';
      mapShell.appendChild(status);
      mapStatusText = document.getElementById("mapStatusText");

      // Attribution - OS OpenData (licence-clean, replaces CARTO/OSM raster)
      if (!mapShell.querySelector(".coverage-atlas__attribution")) {
        var attr = document.createElement("div");
        attr.className = "coverage-atlas__attribution";
        attr.textContent = "Contains OS data © Crown copyright and database right 2026";
        mapShell.appendChild(attr);
      }
    }

    svg.addEventListener("click", onMapClick);
    svg.addEventListener("keydown", onMapKeydown);
    if (backBtn) backBtn.addEventListener("click", function(e) { e.stopPropagation(); reset(); });

    var zIn = document.getElementById("cgmZoomIn"), zOut = document.getElementById("cgmZoomOut"), zReset = document.getElementById("cgmZoomReset");
    if (zIn) zIn.addEventListener("click", function() {
      // Zoom in toward center, keep current pan
      animateZoom(state.zoom * 1.4, state.panX, state.panY, 200);
    });
    if (zOut) zOut.addEventListener("click", function() {
      // V2.2: Zoom out toward center (panX=0, panY=0) so it never deviates into white space
      var targetZoom = Math.max(1, state.zoom / 1.4);
      // Interpolate pan toward 0 as we zoom out - fully centered at zoom=1
      var panRatio = (targetZoom - 1) / Math.max(0.001, state.zoom - 1);
      var targetPanX = state.panX * panRatio;
      var targetPanY = state.panY * panRatio;
      animateZoom(targetZoom, targetPanX, targetPanY, 200);
    });
    if (zReset) zReset.addEventListener("click", function() { reset(); });

    // V2.2: Mouse wheel zoom - zoom toward cursor position
    svg.addEventListener("wheel", function(e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.15 : 1/1.15;
      var svgPt = clientToSvg(e.clientX, e.clientY);
      zoomToFocal(svgPt[0], svgPt[1], factor);
    }, { passive: false });

    // V2.2: Mouse drag to pan
    var isMapDragging = false;
    var mapDragStartX = 0, mapDragStartY = 0;
    var mapDragStartPanX = 0, mapDragStartPanY = 0;
    var mapDragMoved = false;

    svg.addEventListener("pointerdown", function(e) {
      // Don't start drag if clicking on a cluster or town marker
      if (e.target.closest(".coverage-atlas__cluster, .coverage-atlas__town, .coverage-atlas__user-loc")) return;
      // Don't start drag on touch devices (handled by pinch gesture)
      if (e.pointerType === "touch") return;
      isMapDragging = true;
      mapDragMoved = false;
      mapDragStartX = e.clientX;
      mapDragStartY = e.clientY;
      mapDragStartPanX = state.panX;
      mapDragStartPanY = state.panY;
      svg.style.cursor = "grabbing";
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function(e) {
      if (!isMapDragging) return;
      var rect = svg.getBoundingClientRect();
      var dx = (e.clientX - mapDragStartX) * (OW / rect.width);
      var dy = (e.clientY - mapDragStartY) * (OH / rect.height);
      if (Math.abs(e.clientX - mapDragStartX) > 3 || Math.abs(e.clientY - mapDragStartY) > 3) {
        mapDragMoved = true;
      }
      state.panX = mapDragStartPanX + dx;
      state.panY = mapDragStartPanY + dy;
      applyTransform();
    });
    svg.addEventListener("pointerup", function(e) {
      if (isMapDragging) {
        isMapDragging = false;
        svg.style.cursor = "";
        try { svg.releasePointerCapture(e.pointerId); } catch(err) {}
        // If we dragged, suppress the click event so we don't accidentally click a marker
        if (mapDragMoved) {
          svg.addEventListener("click", function suppressClick(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            svg.removeEventListener("click", suppressClick, true);
          }, true);
        }
      }
    });
    svg.addEventListener("pointercancel", function() {
      isMapDragging = false;
      svg.style.cursor = "";
    });

    // V2.2: Touch pinch-to-zoom and double-tap-to-zoom
    var pinchStartDist = 0;
    var pinchStartZoom = 1;
    var pinchStartSvgX = 0, pinchStartSvgY = 0;
    var lastTapTime = 0;
    var lastTapX = 0, lastTapY = 0;

    svg.addEventListener("touchstart", function(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        var t0 = e.touches[0], t1 = e.touches[1];
        var dx = t1.clientX - t0.clientX;
        var dy = t1.clientY - t0.clientY;
        pinchStartDist = Math.sqrt(dx*dx + dy*dy);
        pinchStartZoom = state.zoom;
        // Focal point is the midpoint between the two fingers
        var midX = (t0.clientX + t1.clientX) / 2;
        var midY = (t0.clientY + t1.clientY) / 2;
        var svgPt = clientToSvg(midX, midY);
        pinchStartSvgX = svgPt[0];
        pinchStartSvgY = svgPt[1];
      } else if (e.touches.length === 1) {
        // Double-tap detection
        var now = Date.now();
        var tap = e.touches[0];
        if (now - lastTapTime < 300 && Math.abs(tap.clientX - lastTapX) < 30 && Math.abs(tap.clientY - lastTapY) < 30) {
          e.preventDefault();
          // Double tap: toggle zoom (zoom in if at overview, zoom out if zoomed in)
          if (state.zoom > 1.2) {
            // Zoom out to center
            animateZoom(1, 0, 0, 300);
          } else {
            // Zoom in toward tap point
            var svgPt = clientToSvg(tap.clientX, tap.clientY);
            zoomToFocal(svgPt[0], svgPt[1], 2.5);
          }
          lastTapTime = 0;
        } else {
          lastTapTime = now;
          lastTapX = tap.clientX;
          lastTapY = tap.clientY;
        }
      }
    }, { passive: false });

    svg.addEventListener("touchmove", function(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        var t0 = e.touches[0], t1 = e.touches[1];
        var dx = t1.clientX - t0.clientX;
        var dy = t1.clientY - t0.clientY;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (pinchStartDist > 0) {
          var factor = dist / pinchStartDist;
          var newZoom = Math.max(1, Math.min(8, pinchStartZoom * factor));
          if (newZoom !== state.zoom) {
            // Zoom toward the pinch focal point
            var ratio = newZoom / state.zoom;
            var screenX = pinchStartSvgX - OW/2;
            var screenY = pinchStartSvgY - OH/2;
            state.panX = screenX - (screenX - state.panX) * ratio;
            state.panY = screenY - (screenY - state.panY) * ratio;
            state.zoom = newZoom;
            applyTransform();
          }
        }
      }
    }, { passive: false });

    svg.addEventListener("touchend", function(e) {
      if (e.touches.length < 2) {
        pinchStartDist = 0;
      }
    });

    // Public API - includes classifyLocation for direct external use
    window.CGMMap = {
      focusTown: focusTown,
      showUserLocation: showUserLocation,
      reset: reset,
      getState: function() { return Object.assign({}, state); },
      classifyLocation: function (lat, lng) {
        var xy = latlngToSVG(lat, lng);
        return classifySVGPoint(xy[0], xy[1]);
      }
    };

    // Emit map-ready so the inline locations script can perform the single
    // coordinated hash restoration. The map renderer does NOT restore the
    // hash itself - that ownership lives in the inline script to avoid
    // duplicate town-state events and race conditions.
    document.dispatchEvent(
      new CustomEvent("cgm:map-ready", {
        detail: window.CGMMap.getState()
      })
    );

    console.log("CGM Map V2.2: Landscape renderer initialised (" + OW + "×" + OH + ")");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
