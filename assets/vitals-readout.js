/* vitals-readout.js — Layer L4: hero-card "// this page" readout
   Loads on: index.html only
   Exports: fills #hc-vital-lcp / #hc-vital-cls / #hc-vital-ttfb text content
   Must not: fabricate numbers — every value shown is a real, live measurement
   of THIS page load via the standard Performance APIs. If an API is
   unsupported, the row is left as "—" rather than filled with a guess.
   Kill-switch: window.__VITALS_DISABLED = true before this script loads */
(function () {
  'use strict';
  if (window.__VITALS_DISABLED) return;
  if (!('PerformanceObserver' in window)) return;

  var els = {
    lcp: document.getElementById('hc-vital-lcp'),
    cls: document.getElementById('hc-vital-cls'),
    ttfb: document.getElementById('hc-vital-ttfb')
  };
  if (!els.lcp && !els.cls && !els.ttfb) return;

  function setThreshold(el, value, good, needsImprovement) {
    if (!el) return;
    el.classList.remove('hc-vital--good', 'hc-vital--ok', 'hc-vital--poor');
    if (value <= good) el.classList.add('hc-vital--good');
    else if (value <= needsImprovement) el.classList.add('hc-vital--ok');
    else el.classList.add('hc-vital--poor');
  }

  /* ── TTFB — Navigation Timing, available almost immediately ── */
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && els.ttfb) {
      var ttfb = Math.max(0, Math.round(nav.responseStart - nav.requestStart));
      els.ttfb.textContent = ttfb + 'ms';
      setThreshold(els.ttfb, ttfb, 800, 1800);
    }
  } catch (e) { /* leave as "—" */ }

  /* ── LCP — updates until the user's first interaction/tab hide, per spec ── */
  if (els.lcp) {
    try {
      var lcpValue = null;
      var lcpObserver = new PerformanceObserver(function (list) {
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if (!last) return;
        lcpValue = last.renderTime || last.loadTime || 0;
        els.lcp.textContent = (lcpValue / 1000).toFixed(2) + 's';
        setThreshold(els.lcp, lcpValue, 2500, 4000);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      ['keydown', 'click', 'visibilitychange'].forEach(function (type) {
        window.addEventListener(type, function () { lcpObserver.takeRecords(); lcpObserver.disconnect(); }, { once: true, capture: true });
      });
    } catch (e) { /* leave as "—" */ }
  }

  /* ── CLS — cumulative layout shift, excluding user-triggered shifts ── */
  if (els.cls) {
    try {
      var clsValue = 0;
      var clsObserver = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        });
        els.cls.textContent = clsValue.toFixed(2);
        setThreshold(els.cls, clsValue, 0.1, 0.25);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) { /* leave as "—" */ }
  }
}());
