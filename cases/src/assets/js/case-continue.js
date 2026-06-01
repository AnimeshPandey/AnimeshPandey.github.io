/**
 * case-continue.js — reveal continue CTA when takeaway completes.
 */
(function initCaseContinue() {
  'use strict';

  function boot() {
    var section = document.getElementById('case-continue');
    if (!section) return;

    var slug = section.dataset.caseSlug;
    var state = window.CaseyCompanion && window.CaseyCompanion.getState
      ? window.CaseyCompanion.getState()
      : null;

    if (state && state.casesCompleted && state.casesCompleted.indexOf(slug) !== -1) {
      section.classList.add('case-continue--completed');
    }

    document.addEventListener('case-case-completed', function (e) {
      if (!e.detail || e.detail.slug !== slug) return;
      section.classList.add('case-continue--completed');
      section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
