/**
 * casey-hub.js — hub surface; delegates to CaseyCompanion + CaseyGuide.
 */
(function initCaseyHub() {
  if (!document.querySelector('[data-casey-hub]') || !window.CaseyCompanion) return;

  var hubData = {};
  var dataEl = document.getElementById('casey-hub-data');
  if (dataEl) {
    try { hubData = JSON.parse(dataEl.textContent); } catch (e) { /* ignore */ }
  }
  var hubEl = document.querySelector('[data-casey-hub]');

  function tryReviewDueGreeting() {
    var greetEl = document.querySelector('[data-casey-greeting]');
    if (!greetEl) return false;
    var titlesEl = document.getElementById('hub-case-titles');
    var titles = {};
    try { titles = titlesEl ? JSON.parse(titlesEl.textContent) : {}; } catch (e) { /* ignore */ }
    var state = window.CaseyCompanion.getState();
    var reviewSlug = window.CaseyCompanion.pickReviewDueSlug(state.caseProgress, titles);
    if (!reviewSlug) return false;
    var tier =
      document.documentElement.dataset.casebookTone ||
      ((document.querySelector('[data-casey-tier]') || {}).dataset.caseyTier) ||
      'junior';
    var line = window.CaseyCompanion.lineAt('hub.reviewDue', tier, { title: titles[reviewSlug] });
    if (!line) return false;
    greetEl.textContent = line;
    return true;
  }

  window.CaseyCompanion.init({
    surface: 'hub',
    hubData: hubData,
    flagshipSlug: hubEl && hubEl.dataset.flagshipSlug,
  }).then(function () {
    // A due-for-review case is a more specific, more actionable nudge than
    // CaseyGuide's generic streak/first-visit greeting — show it and skip
    // CaseyGuide's own suggestion for this load rather than letting it
    // immediately overwrite the text set here.
    if (tryReviewDueGreeting()) return;
    if (!window.CaseyGuide) return;
    var suggestion = CaseyGuide.suggest('hub');
    if (!suggestion) return;

    var greetEl = document.querySelector('[data-casey-greeting]');
    if (greetEl && suggestion.line) greetEl.textContent = suggestion.line;

    if (suggestion.pose && window.CaseyCompanion.setImgPose) {
      var avatar = document.querySelector('[data-casey-hub-avatar]');
      if (avatar) {
        var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
        var tier =
          (document.documentElement.dataset.casebookTone) ||
          ((document.querySelector('[data-casey-tier]') || {}).dataset.caseyTier) ||
          'junior';
        window.CaseyCompanion.setImgPose(avatar, assetBase, 'png', tier, suggestion.pose, {});
      }
    }
  });

  document.addEventListener('casey-hub-filter', function (e) {
    var d = e.detail || {};
    if (!window.CaseyGuide || d.count !== 0 || !d.track) return;
    var zeroPick = CaseyGuide.suggest('hub-zero');
    if (!zeroPick) return;
    var greetEl2 = document.querySelector('[data-casey-greeting]');
    if (greetEl2 && zeroPick.line) greetEl2.textContent = zeroPick.line;
  });
}());
