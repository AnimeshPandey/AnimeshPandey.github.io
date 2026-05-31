/**
 * casey-coach.js
 * Owns: avatar FSM, hint display from casey.json,
 *       listens to casebook-tone-change + casebook-color-change.
 *       Does NOT own demo, scroll progress, or color mode logic.
 */
(function initCaseyCoach() {
  var dataEl = document.getElementById('casey-data');
  if (!dataEl) return;

  var caseyData;
  try { caseyData = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var html = document.documentElement;
  var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Asset base ── */
  var assetBase = html.dataset.assetBase || '/cases/assets/casey/';

  /* ── State ── */
  var currentTone = 'junior';
  var currentChapter = null;

  /* ── All coach cards (desktop aside + mobile dock) ── */
  var cards = document.querySelectorAll('.casey-coach__card');
  var bubbles = document.querySelectorAll('.casey-coach__bubble');
  var avatars = document.querySelectorAll('[data-casey-avatar]');

  /* ── Avatar path ── */
  function avatarSrc(tier, pose) {
    return assetBase + tier + '/' + (pose || 'idle') + '.svg';
  }

  function setAvatar(tier, pose) {
    avatars.forEach(function (img) {
      img.src = avatarSrc(tier, pose);
      img.alt = 'Casey, ' + tier + ' (' + pose + ')';
    });
    cards.forEach(function (card) {
      card.dataset.caseyTier = tier;
      card.dataset.caseyState = pose || 'idle';
    });
    var nameEls = document.querySelectorAll('.casey-coach__name');
    nameEls.forEach(function (el) {
      el.textContent = 'Casey · ' + tier.charAt(0).toUpperCase() + tier.slice(1);
    });
  }

  /* ── Bubble text ── */
  function setBubble(text) {
    bubbles.forEach(function (b) { b.textContent = text || ''; });
  }

  /* ── Get hint for current chapter + tone ── */
  function getHint(chapter, tone) {
    if (!caseyData) return null;
    var hints = caseyData.hints || [];
    for (var i = 0; i < hints.length; i++) {
      if (hints[i].chapter === chapter) return hints[i][tone] || hints[i].junior || null;
    }
    /* Try anecdotes */
    var anecdotes = caseyData.anecdotes || [];
    for (var j = 0; j < anecdotes.length; j++) {
      if (anecdotes[j].chapter === chapter) return anecdotes[j][tone] || null;
    }
    return null;
  }

  /* ── On chapter enter ── */
  function onChapterEnter(chapterId) {
    currentChapter = chapterId;
    var hint = getHint(chapterId, currentTone);
    var pose = chapterId === 'demo' ? 'point' : (hint ? 'perk' : 'idle');
    if (prm) pose = 'idle';
    setAvatar(currentTone, pose);
    if (hint) setBubble(hint);
  }

  /* ── Watch chapters with IO ── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          onChapterEnter(entry.target.dataset.chapter);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.case-chapter[data-chapter]').forEach(function (ch) {
      io.observe(ch);
    });
  }

  /* ── Listen for tone changes ── */
  document.addEventListener('casebook-tone-change', function (e) {
    var newTone = e.detail && e.detail.tone;
    if (!newTone) return;
    currentTone = newTone;
    setAvatar(newTone, 'idle');
    var hint = currentChapter ? getHint(currentChapter, newTone) : null;
    setBubble(hint || 'Switching to ' + newTone + ' mode.');
  });

  /* ── Listen for color changes (cancel speech handled by casey-voice) ── */
  document.addEventListener('casebook-color-change', function () {
    /* Refresh avatar with same tier/pose in case CSS needs update */
    setAvatar(currentTone, prm ? 'idle' : (currentChapter === 'demo' ? 'point' : 'idle'));
  });

  /* ── Mobile dock: show after init ── */
  var dock = document.getElementById('casey-dock');
  if (dock) dock.hidden = false;

  /* Initial state */
  setAvatar(currentTone, 'idle');

  /* ── casey-interactions.json: tier labels + optional blink ── */
  var interactionsUrl = assetBase.replace(/\/?$/, '/') + 'casey-interactions.json';
  fetch(interactionsUrl)
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (cfg) {
      if (!cfg) return;
      if (cfg.tierLabels) {
        var labelEls = document.querySelectorAll('.casey-coach__name, [data-casey-tier-label]');
        labelEls.forEach(function (el) {
          var tier = el.closest('[data-casey-tier]') && el.closest('[data-casey-tier]').dataset.caseyTier;
          if (!tier) tier = currentTone;
          if (cfg.tierLabels[tier]) el.textContent = cfg.tierLabels[tier];
        });
      }
      var blinkRule = (cfg.interactions || []).filter(function (r) { return r.id === 'blink'; })[0];
      if (!blinkRule || prm) return;
      function scheduleBlink() {
        var min = blinkRule.intervalMsMin || 4000;
        var max = blinkRule.intervalMsMax || 8000;
        var delay = min + Math.random() * (max - min);
        setTimeout(function () {
          setAvatar(currentTone, 'blink');
          setTimeout(function () {
            setAvatar(currentTone, 'idle');
            scheduleBlink();
          }, blinkRule.durationMs || 400);
        }, delay);
      }
      scheduleBlink();
    })
    .catch(function () { /* optional file */ });

}());
