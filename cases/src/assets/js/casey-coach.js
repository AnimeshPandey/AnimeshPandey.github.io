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

  // CaseyGuide: set a smarter opening bubble based on the user's progress context.
  if (window.CaseyGuide) {
    CaseyGuide.recordEvent('case-started');
    var startSuggestion = CaseyGuide.suggest('case-start');
    if (startSuggestion && startSuggestion.line) {
      document.querySelectorAll('.casey-coach__bubble').forEach(function (el) {
        el.textContent = startSuggestion.line;
      });
    }
  }

  // Listen for case completion and forward to CaseyGuide.
  document.addEventListener('case-case-completed', function () {
    if (window.CaseyGuide) {
      CaseyGuide.recordEvent('case-completed');
    }
  });
}());
