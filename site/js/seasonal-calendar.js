/* CGM Seasonal Calendar - town data viewer */
(function () {
  "use strict";

  var base = "/chilterngardenmaintenance-updatedsite/";
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var tagNames = {
    frost: "Frost and protection",
    "sow-plant": "Sow and plant",
    flowering: "What is in flower",
    prune: "Prune and train",
    lawn: "Lawn care",
    "feed-mulch": "Feed and mulch",
    water: "Watering",
    "pests-watch": "Watch for pests"
  };
  // Bar visualisation — must match the CSS bar classes and the cal-strip HTML.
  var TAG_ORDER = ["frost", "sow-plant", "flowering", "prune", "lawn", "feed-mulch", "water", "pests-watch"];
  var TAG_TO_BAR = {
    "frost": "frost",
    "sow-plant": "sow",
    "flowering": "flower",
    "prune": "prune",
    "lawn": "lawn",
    "feed-mulch": "feed",
    "water": "water",
    "pests-watch": "pests"
  };
  var towns = [];
  var selected = 0;
  var select = document.getElementById("calendarTown");
  var previous = document.getElementById("calendarPrev");
  var next = document.getElementById("calendarNext");
  var status = document.getElementById("calendarStatus");
  var months = document.getElementById("calendarMonths");

  function queryTown() {
    var params = new URLSearchParams(window.location.search);
    var fromQuery = params.get("town");
    var fromHash = window.location.hash.match(/town=([^&]+)/);
    return (fromQuery || (fromHash && fromHash[1]) || "").toLowerCase();
  }

  function make(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function populateTownSelect() {
    var groups = {};
    towns.forEach(function (town) {
      if (!groups[town.county]) groups[town.county] = [];
      groups[town.county].push(town);
    });
    Object.keys(groups).sort().forEach(function (county) {
      var group = document.createElement("optgroup");
      group.label = county;
      groups[county].sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (town) {
        var option = document.createElement("option");
        option.value = town.slug;
        option.textContent = town.name;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  }

  function updateUrl(town) {
    var url = new URL(window.location.href);
    url.searchParams.set("town", town.slug);
    window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString() + "#seasonal-calendar");
  }

  function renderTown() {
    var town = towns[selected];
    if (!town) return;
    select.value = town.slug;
    updateUrl(town);
    status.textContent = town.name + " · " + town.county + (town.region ? " · " + town.region : "");
    months.replaceChildren();

    // Bar visualization strip (12 months x 8 activity types) — same data as
    // the cal-strip on town pages, rendered here as a single overview row.
    var overview = make("div", "seasonal-calendar-overview");
    var overviewLabel = make("p", "seasonal-calendar-overview__label",
      "12-month overview — coloured bars show what is happening in the garden each month.");
    overview.appendChild(overviewLabel);
    var strip = make("div", "cal-strip seasonal-calendar-overview__strip");
    (town.calendar || []).slice().sort(function (a, b) { return a.m - b.m; }).forEach(function (month) {
      var cell = make("div", "cal-cell cal-cell--data");
      cell.title = (monthNames[month.m - 1] || "Month " + month.m) + ": " + (month.h || "");
      cell.appendChild(make("span", "cal-cell__month", monthNames[month.m - 1] || ("M" + month.m)));
      var bars = make("span", "cal-cell__bars");
      TAG_ORDER.forEach(function (tag) {
        var bar = make("span", "cal-cell__bar cal-cell__bar--" + TAG_TO_BAR[tag]);
        if ((month.t || []).indexOf(tag) >= 0) bar.classList.add("is-active");
        bars.appendChild(bar);
      });
      cell.appendChild(bars);
      strip.appendChild(cell);
    });
    overview.appendChild(strip);

    // Legend
    var legend = make("div", "cal-legend seasonal-calendar-overview__legend");
    TAG_ORDER.forEach(function (tag) {
      var item = make("span", "cal-legend__item");
      var dot = make("span", "cal-dot cal-dot--" + TAG_TO_BAR[tag]);
      item.appendChild(dot);
      item.appendChild(document.createTextNode(" " + tagNames[tag]));
      legend.appendChild(item);
    });
    overview.appendChild(legend);
    months.appendChild(overview);

    // Detailed month cards
    (town.calendar || []).slice().sort(function (a, b) { return a.m - b.m; }).forEach(function (month) {
      var card = make("article", "seasonal-calendar-card");
      card.appendChild(make("span", "seasonal-calendar-card__month", monthNames[month.m - 1] || "Month " + month.m));
      card.appendChild(make("h3", "seasonal-calendar-card__heading", month.h || "Seasonal garden work"));
      var tags = make("div", "seasonal-calendar-card__tags");
      (month.t || []).forEach(function (tag) {
        var tagSpan = make("span", "seasonal-calendar-card__tag seasonal-calendar-card__tag--" + TAG_TO_BAR[tag],
          tagNames[tag] || tag);
        tags.appendChild(tagSpan);
      });
      card.appendChild(tags);
      months.appendChild(card);
    });

    var townLink = make("a", "seasonal-calendar-town-link", "View the " + town.name + " town profile →");
    townLink.href = base + "locations/" + town.slug + ".html";
    months.appendChild(townLink);
  }

  function selectBySlug(slug) {
    var index = towns.findIndex(function (town) { return town.slug === slug; });
    if (index >= 0) selected = index;
    renderTown();
  }

  function move(amount) {
    if (!towns.length) return;
    selected = (selected + amount + towns.length) % towns.length;
    renderTown();
  }

  function init() {
    if (!select || !months) return;
    fetch(base + "_private-data/towns-full.json", { cache: "force-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("Calendar data could not be loaded");
        return response.json();
      })
      .then(function (data) {
        towns = Array.isArray(data) ? data.slice() : [];
        towns.sort(function (a, b) {
          return (a.county + a.name).localeCompare(b.county + b.name);
        });
        populateTownSelect();
        selectBySlug(queryTown() || "oxford");
      })
      .catch(function (error) {
        console.error("CGM seasonal calendar:", error);
        status.textContent = "The calendar is temporarily unavailable. Please use the town profiles on the locations page.";
      });

    select.addEventListener("change", function () { selectBySlug(select.value); });
    previous.addEventListener("click", function () { move(-1); });
    next.addEventListener("click", function () { move(1); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
