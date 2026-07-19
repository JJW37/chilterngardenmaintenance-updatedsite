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

    (town.calendar || []).slice().sort(function (a, b) { return a.m - b.m; }).forEach(function (month) {
      var card = make("article", "seasonal-calendar-card");
      card.appendChild(make("span", "seasonal-calendar-card__month", monthNames[month.m - 1] || "Month " + month.m));
      card.appendChild(make("h3", "seasonal-calendar-card__heading", month.h || "Seasonal garden work"));
      var tags = make("div", "seasonal-calendar-card__tags");
      (month.t || []).forEach(function (tag) {
        tags.appendChild(make("span", "seasonal-calendar-card__tag", tagNames[tag] || tag));
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
