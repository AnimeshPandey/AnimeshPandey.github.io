/**
 * casey-hub.js — hub surface; delegates to CaseyCompanion.
 */
(function initCaseyHub() {
  if (!document.querySelector('[data-casey-hub]') || !window.CaseyCompanion) return;
  var hubData = {};
  var dataEl = document.getElementById('casey-hub-data');
  if (dataEl) {
    try {
      hubData = JSON.parse(dataEl.textContent);
    } catch (e) { /* ignore */ }
  }
  var hubEl = document.querySelector('[data-casey-hub]');
  window.CaseyCompanion.init({
    surface: 'hub',
    hubData: hubData,
    flagshipSlug: hubEl && hubEl.dataset.flagshipSlug,
  });

  // CaseyGuide: inject a context-aware greeting line if the element exists.
  if (window.CaseyGuide) {
    var suggestion = CaseyGuide.suggest('hub');
    if (suggestion) {
      var greetEl = document.querySelector('[data-casey-greeting]');
      if (greetEl) greetEl.textContent = suggestion.line;
    }
  }
}());
