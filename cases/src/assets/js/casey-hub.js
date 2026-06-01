/**
 * casey-hub.js
 * Casey on the hub homepage: greeting rotation, tone sync, action pose flash.
 * Loads on /cases/ only (included in index.njk). Does NOT duplicate case-coach logic.
 */
(function initCaseyHub() {
  var hubEl = document.querySelector('[data-casey-hub]');
  if (!hubEl) return;

  /* ── Data ── */
  var hubData = {};
  var dataEl = document.getElementById('casey-hub-data');
  if (dataEl) {
    try { hubData = JSON.parse(dataEl.textContent); } catch (e) {}
  }

  var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';

  /* ── DOM refs ── */
  var avatar = hubEl.querySelector('[data-casey-hub-avatar]');
  var greetingEl = document.getElementById('casey-hub-greeting');
  var tierLabelEl = hubEl.querySelector('[data-casey-hub-tier-label]');

  /* ── Tier labels matching casey-interactions.json ── */
  var TIER_LABELS = {
    junior: 'Casey · Junior dev',
    mid: 'Casey · Mid-level dev',
    staff: 'Casey · Staff engineer'
  };

  /* ── State ── */
  var currentTier = readTier();
  var greetingIdx = 0;
  var rotateTimer = null;

  /* ── Helpers ── */
  function readTier() {
    var t;
    try { t = localStorage.getItem('casebook-tone'); } catch (e) {}
    return (['junior', 'mid', 'staff'].indexOf(t) !== -1) ? t : 'junior';
  }

  function greetings(tier) {
    var g = hubData.greetings;
    return (g && (g[tier] || g.junior)) || [];
  }

  function setAvatar(tier) {
    if (!avatar) return;
    var pose = prm ? 'sleep' : 'wave';
    avatar.src = assetBase + tier + '/' + pose + '.svg';
    avatar.alt = 'Casey, ' + tier + ' developer kitten' + (prm ? ', resting' : ', waving hello');
    hubEl.dataset.caseyTier = tier;
  }

  function setTierLabel(tier) {
    if (!tierLabelEl) return;
    tierLabelEl.textContent = TIER_LABELS[tier] || TIER_LABELS.junior;
  }

  function setGreeting(tier, forceIdx) {
    if (!greetingEl) return;
    var g = greetings(tier);
    if (!g.length) return;

    /* First-visit contextual override */
    var firstVisit;
    try { firstVisit = !localStorage.getItem('casebook-visited'); } catch (e) {}
    if (firstVisit) {
      var ctx = (hubData.contextual || []).filter(function (c) { return c.when === 'first-visit'; })[0];
      if (ctx && ctx[tier]) {
        greetingEl.textContent = ctx[tier];
        greetingIdx = 0;
        try { localStorage.setItem('casebook-visited', '1'); } catch (e) {}
        return;
      }
      try { localStorage.setItem('casebook-visited', '1'); } catch (e) {}
    }

    var idx = (typeof forceIdx === 'number') ? forceIdx : 0;
    greetingIdx = idx;
    greetingEl.textContent = g[idx];
  }

  function rotateGreeting() {
    var g = greetings(currentTier);
    if (g.length < 2 || !greetingEl) return;
    greetingIdx = (greetingIdx + 1) % g.length;
    greetingEl.textContent = g[greetingIdx];
  }

  function startRotation() {
    if (prm) return;
    stopRotation();
    rotateTimer = setInterval(function () {
      if (!document.hidden) rotateGreeting();
    }, 30000);
  }

  function stopRotation() {
    if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null; }
  }

  /* ── Initial render ── */
  setAvatar(currentTier);
  setTierLabel(currentTier);
  setGreeting(currentTier);
  startRotation();

  /* ── Pause rotation when tab is hidden ── */
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stopRotation() : startRotation();
  });

  /* ── Tone change sync ── */
  document.addEventListener('casebook-tone-change', function (e) {
    var newTier = e.detail && e.detail.tone;
    if (!newTier || newTier === currentTier) return;
    currentTier = newTier;
    setAvatar(newTier);
    setTierLabel(newTier);
    setGreeting(newTier);
    stopRotation();
    startRotation();
  });

  /* ── Action click: brief pose flash (perk → wave) if motion ok ── */
  if (!prm) {
    hubEl.querySelectorAll('.casey-hub__action').forEach(function (link) {
      link.addEventListener('click', function () {
        if (!avatar) return;
        var waveSrc = assetBase + currentTier + '/wave.svg';
        avatar.src = assetBase + currentTier + '/perk.svg';
        avatar.alt = 'Casey, perking up';
        setTimeout(function () {
          avatar.src = waveSrc;
          avatar.alt = 'Casey, ' + currentTier + ' developer kitten, waving hello';
        }, 380);
      });
    });
  }

}());
