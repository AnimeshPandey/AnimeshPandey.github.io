/**
 * casey-coach.js — case surface; delegates to CaseyCompanion.
 */
(function initCaseyCoach() {
  var dataEl = document.getElementById('casey-data');
  if (!dataEl) return;
  var caseyData;
  try {
    caseyData = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }
  if (!window.CaseyCompanion) return;
  window.CaseyCompanion.init({ surface: 'case', caseyData: caseyData });

  // CaseyGuide: fire read-only events so other modules can react.
  if (window.CaseyGuide) {
    CaseyGuide.recordEvent('case-started');
  }

  // Listen for case completion and forward to CaseyGuide.
  document.addEventListener('case-case-completed', function () {
    if (window.CaseyGuide) {
      CaseyGuide.recordEvent('case-completed');
    }
  });
}());
