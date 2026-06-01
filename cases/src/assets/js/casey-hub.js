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
  window.CaseyCompanion.init({
    surface: 'hub',
    hubData: hubData,
    flagshipSlug: hubEl && hubEl.dataset.flagshipSlug,
  });

  // CaseyGuide: overlay a context-aware greeting + pose after companion sets its defaults.
  if (window.CaseyGuide) {
    var suggestion = CaseyGuide.suggest('hub');
    if (suggestion) {
      var greetEl = document.querySelector('[data-casey-greeting]');
      if (greetEl && suggestion.line) greetEl.textContent = suggestion.line;

      // Apply the suggested pose to the hub avatar if companion exposes setImgPose.
      if (suggestion.pose && window.CaseyCompanion.setImgPose) {
        var avatar = document.querySelector('[data-casey-hub-avatar]');
        if (avatar) {
          var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
          var tier = (document.querySelector('[data-casey-tier]') || {}).dataset.caseyTier || 'junior';
          window.CaseyCompanion.setImgPose(avatar, assetBase, 'png', tier, suggestion.pose, {});
        }
      }
    }
  }

  // CaseyGuide hub-zero: on filter events that yield 0 live results, enrich empty-state copy.
  document.addEventListener('casey-hub-filter', function (e) {
    var d = e.detail || {};
    if (!window.CaseyGuide || d.count !== 0 || !d.track) return;
    var zeroPick = CaseyGuide.suggest('hub-zero');
    if (!zeroPick) return;
    var greetEl2 = document.querySelector('[data-casey-greeting]');
    if (greetEl2 && zeroPick.line) greetEl2.textContent = zeroPick.line;
  });
}());
