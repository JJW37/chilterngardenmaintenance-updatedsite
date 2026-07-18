/* CGM Locations UI V2.1 - Clean state renderer
 * Listens for cgm:map-state, cgm:coverage-result, cgm:coverage-clear.
 * Renders the right-panel dynamic states and the left-panel coverage result.
 * Pure event-driven renderer - no polling, no DOM observation, no geometry.
 */

(function () {
  "use strict";

  var resultEl;
  var overviewEl;
  var dynamicEl;

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function text(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  }

  function link(className, href, value) {
    var node = document.createElement("a");
    node.className = className;
    node.href = href;
    node.textContent = value;
    return node;
  }

  // --- Coverage result card (left panel) ---

  function renderCoverageResult(detail) {
    if (!resultEl) return;
    clearNode(resultEl);

    var coverage = detail.coverage || "outside";
    var statusClass =
      coverage === "regular" ? "coverage-result--regular" :
      coverage === "extended" ? "coverage-result--extended" :
      "coverage-result--outside";
    resultEl.className = "coverage-result " + statusClass;
    resultEl.hidden = false;

    var nearestName = detail.nearestTown
      ? detail.nearestTown.name
      : "Unknown";

    if (coverage === "regular") {
      resultEl.appendChild(text("p", "coverage-result__status",
        "Within our regular coverage"));
      if (detail.query) {
        resultEl.appendChild(text("p", "coverage-result__postcode", detail.query));
      }
      resultEl.appendChild(text("p", "coverage-result__detail",
        "Nearest service town: " + nearestName));
      if (detail.distanceKm) {
        resultEl.appendChild(text("p", "coverage-result__distance",
          detail.distanceKm.toFixed(1) + " km from the service town"));
      }
      var actionsR = document.createElement("div");
      actionsR.className = "coverage-result__actions";
      if (detail.nearestTown && detail.nearestTown.slug) {
        actionsR.appendChild(link("coverage-result__link coverage-result__link--secondary",
          "/locations/" + detail.nearestTown.slug + ".html",
          "View " + nearestName + " garden information"));
      }
      actionsR.appendChild(link("coverage-result__link coverage-result__link--primary",
        "/booking/", "Request a quotation"));
      resultEl.appendChild(actionsR);
    } else if (coverage === "extended") {
      resultEl.appendChild(text("p", "coverage-result__status",
        "Selected-project coverage"));
      resultEl.appendChild(text("p", "coverage-result__detail",
        "Nearest service town: " + nearestName));
      resultEl.appendChild(text("p", "coverage-result__note",
        "Coverage depends on service and project size"));
      var actionsE = document.createElement("div");
      actionsE.className = "coverage-result__actions";
      if (detail.nearestTown && detail.nearestTown.slug) {
        actionsE.appendChild(link("coverage-result__link coverage-result__link--secondary",
          "/locations/" + detail.nearestTown.slug + ".html",
          "View local information"));
      }
      actionsE.appendChild(link("coverage-result__link coverage-result__link--primary",
        "/booking/", "Request a quotation"));
      resultEl.appendChild(actionsE);
    } else {
      resultEl.appendChild(text("p", "coverage-result__status",
        "Outside our usual area"));
      resultEl.appendChild(text("p", "coverage-result__detail",
        "Nearest service town: " + nearestName));
      resultEl.appendChild(text("p", "coverage-result__note",
        "Larger transformations may still be possible"));
      var actionsO = document.createElement("div");
      actionsO.className = "coverage-result__actions";
      actionsO.appendChild(link("coverage-result__link coverage-result__link--primary",
        "/booking/", "Send us your project details"));
      resultEl.appendChild(actionsO);
    }
  }

  function clearCoverageResult() {
    if (!resultEl) return;
    clearNode(resultEl);
    resultEl.hidden = true;
    resultEl.className = "coverage-result";
  }

  // --- Right panel dynamic content ---

  function setPanelMode(mode) {
    if (overviewEl) overviewEl.hidden = mode !== "overview";
    if (dynamicEl) dynamicEl.hidden = mode === "overview";
  }

  function renderOverview() {
    setPanelMode("overview");
    if (dynamicEl) clearNode(dynamicEl);
  }

  function renderCluster(detail) {
    if (!dynamicEl) return;
    clearNode(dynamicEl);
    setPanelMode("cluster");

    var c = detail.clusterData;
    if (!c) return;

    dynamicEl.appendChild(text("p", "coverage-atlas__dynamic-heading",
      c.name.toUpperCase() + " AREA"));
    dynamicEl.appendChild(text("p", "coverage-atlas__dynamic-sub",
      c.count + " covered towns"));

    var list = document.createElement("p");
    list.className = "coverage-atlas__dynamic-list";
    var shown = c.towns.slice(0, 6).map(function (t) { return t.name; });
    var more = c.towns.length > 6
      ? " +" + (c.towns.length - 6) + " more"
      : "";
    list.textContent = shown.join(" · ") + more;
    dynamicEl.appendChild(list);

    if (c.id) {
      dynamicEl.appendChild(link("coverage-atlas__dynamic-cta",
        "#town-swiper", "Browse " + c.name + "-area towns"));
    }
  }

  function renderTown(detail) {
    if (!dynamicEl) return;
    clearNode(dynamicEl);
    setPanelMode("town");

    var t = detail.townData;
    if (!t) return;

    dynamicEl.appendChild(text("p", "coverage-atlas__dynamic-heading",
      t.name.toUpperCase()));
    var meta = (t.county || "") + " · " +
      (t.coverage === "extended" ? "Extended coverage" : "Regular coverage");
    dynamicEl.appendChild(text("p", "coverage-atlas__dynamic-sub", meta));

    if (t.slug) {
      dynamicEl.appendChild(link("coverage-atlas__dynamic-cta",
        "/locations/" + t.slug + ".html",
        "View " + t.name + " garden information"));
    }
    dynamicEl.appendChild(link("coverage-atlas__dynamic-cta coverage-atlas__dynamic-cta--ghost",
      "/booking/", "Request a quotation"));
  }

  function renderLocation(detail) {
    if (!dynamicEl) return;
    clearNode(dynamicEl);
    setPanelMode("location");

    dynamicEl.appendChild(text("p", "coverage-atlas__dynamic-heading",
      "YOUR LOCATION"));
    var nt = detail.nearestTown;
    var coverage = detail.coverage || (nt ? nt.coverage : null) || "outside";
    var coverageText =
      coverage === "regular" ? "Within regular coverage" :
      coverage === "extended" ? "Selected-project coverage" :
      "Outside our usual area";
    dynamicEl.appendChild(text("p", "coverage-atlas__dynamic-sub",
      coverageText + (nt ? " · Nearest service town: " + nt.name : "")));

    if (nt && nt.slug) {
      dynamicEl.appendChild(link("coverage-atlas__dynamic-cta",
        "/locations/" + nt.slug + ".html",
        "View local information"));
    }
    dynamicEl.appendChild(link("coverage-atlas__dynamic-cta coverage-atlas__dynamic-cta--ghost",
      "/booking/", "Request a quotation"));
  }

  function renderMapState(detail) {
    if (!detail) return;
    var mode = detail.mode;
    if (mode === "overview") {
      renderOverview();
    } else if (mode === "cluster") {
      renderCluster(detail);
    } else if (mode === "town") {
      renderTown(detail);
    } else if (mode === "location") {
      renderLocation(detail);
    }
  }

  // --- Initialisation ---

  function init() {
    resultEl = document.getElementById("coverageResult");
    overviewEl = document.getElementById("coverageOverviewContent");
    dynamicEl = document.getElementById("coverageDynamicContent");

    document.addEventListener("cgm:coverage-result", function (e) {
      renderCoverageResult(e.detail || {});
    });

    document.addEventListener("cgm:coverage-clear", function () {
      clearCoverageResult();
    });

    document.addEventListener("cgm:map-state", function (e) {
      renderMapState(e.detail || {});
    });

    // Render initial overview (default state) - this is the safe initial view
    renderOverview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
