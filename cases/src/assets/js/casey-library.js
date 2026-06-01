/**
 * casey-library.js — library strip; delegates to CaseyCompanion.
 */
(function initCaseyLibrary() {
  if (!document.querySelector('[data-casey-library]') || !window.CaseyCompanion) return;
  var data = {};
  var dataEl = document.getElementById('casey-library-data');
  if (dataEl) {
    try {
      data = JSON.parse(dataEl.textContent);
    } catch (e) { /* ignore */ }
  }
  window.CaseyCompanion.init({ surface: 'library', libraryData: data });
}());
