/**
 * casey-library.js — Casey strip on /library/: read pose + tone-synced copy.
 */
(function initCaseyLibrary() {
  var root = document.querySelector('[data-casey-library]');
  if (!root) return;

  var dataEl = document.getElementById('casey-library-data');
  var data = {};
  if (dataEl) {
    try { data = JSON.parse(dataEl.textContent); } catch (e) {}
  }

  var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
  var assetExt = 'png';
  var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var avatar = root.querySelector('[data-casey-library-avatar]');
  var lineEl = document.getElementById('casey-library-line');
  var labelEl = root.querySelector('[data-casey-library-tier-label]');

  var TIER_LABELS = {
    junior: 'Casey · Junior dev',
    mid: 'Casey · Mid-level dev',
    staff: 'Casey · Staff engineer',
  };

  function readTier() {
    try {
      var t = localStorage.getItem('casebook-tone');
      if (['junior', 'mid', 'staff'].indexOf(t) !== -1) return t;
    } catch (e) {}
    return 'junior';
  }

  function setTier(tier) {
    if (avatar) {
      if (!prm) {
        avatar.classList.remove('casey-tier-fade');
        void avatar.offsetWidth;
        avatar.classList.add('casey-tier-fade');
        setTimeout(function () { avatar.classList.remove('casey-tier-fade'); }, 280);
      }
      avatar.src = assetBase + tier + '/read.' + assetExt;
      avatar.alt = 'Casey, ' + tier + ' developer, reading library guide';
    }
    if (labelEl) labelEl.textContent = TIER_LABELS[tier] || TIER_LABELS.junior;
    if (lineEl && data.lines) {
      lineEl.textContent = data.lines[tier] || data.lines.junior || '';
    }
    root.dataset.caseyTier = tier;
  }

  var current = readTier();
  setTier(current);

  document.addEventListener('casebook-tone-change', function (e) {
    var t = e.detail && e.detail.tone;
    if (!t || t === current) return;
    current = t;
    setTier(t);
  });
}());
