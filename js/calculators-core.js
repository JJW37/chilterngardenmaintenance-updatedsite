/* Chiltern Garden Maintenance - Calculator Core (shared helpers)
   Loaded by all calculator pages alongside the specific calculator module. */

  "use strict";

  /* ---- Helper functions ---- */

  function radioValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function numberValue(name) {
    var el = document.querySelector('input[name="' + name + '"]');
    return el && el.value ? parseFloat(el.value) : 0;
  }

  // The standard disclaimer shown on every result
  function disclaimerBlock() {
    return '<div class="calc-disclaimer" style="background:rgba(180,40,40,.12);border:2px solid rgba(180,40,40,.4);padding:.8rem 1rem;border-radius:8px;margin-top:.8rem;font-size:.9rem;line-height:1.5;">' +
      '<strong style="color:#fff;display:block;margin-bottom:.3rem;">\u26A0\uFE0F Indicative level only</strong>' +
      'This result gives an <strong>indicative level (1 to 4)</strong>, not a cost or time estimate. ' +
      '<strong>No prices or hours are shown.</strong> The actual level, scope and price can only be confirmed ' +
      'once we see the site in person, because access, waste, ground conditions, material choice, ' +
      'urgency and site complexity all affect what is really involved. ' +
      '<strong>The level shown may move up or down once we assess the site.</strong> ' +
      '<strong>For an accurate, fixed price, contact us via our ' +
      '<a href="/chilterngardenmaintenance-updatedsite/booking/" style="color:var(--gold-light);text-decoration:underline;">quote form</a>.</strong>' +
      '</div>' +
      '<div style="margin-top:.8rem;display:flex;flex-direction:column;gap:.5rem;">' +
      '<a class="btn btn-primary" href="/chilterngardenmaintenance-updatedsite/booking/" style="width:100%;justify-content:center;">Get an accurate quote</a>' +
      '<a class="btn btn-whatsapp" href="https://wa.me/447467657459" target="_blank" rel="noopener" style="width:100%;justify-content:center;">WhatsApp</a>' +
      '<a class="btn btn-primary" href="/chilterngardenmaintenance-updatedsite/portfolio/" style="width:100%;justify-content:center;">See our portfolio</a>' +
      '</div>';
  }

  function showResult(calcId, content, summary) {
    var rangeEl = document.getElementById(calcId + '-range');
    var sumEl = document.getElementById(calcId + '-summary');
    var box = document.getElementById(calcId + '-result');
    if (rangeEl) rangeEl.innerHTML = content;
    if (sumEl) sumEl.innerHTML = summary + disclaimerBlock();
    if (box) box.hidden = false;
  }

  /* ---- CLEARANCE CALCULATOR ----
     Uses Levels 1-4 instead of man-hours.
     Level 1 - Smaller Garden Clearance
     Level 2 - Significant Garden Clearance
     Level 3 - Large Garden Clearance
     Level 4 - Major Garden Clearance

     Algorithm: Calculate a raw score from inputs, then divide into quarters
     from the minimum threshold up to the maximum.
  */
