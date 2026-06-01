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

  /* ── Asset base (raster poses; see style-anchor/ for tier fronts) ── */
  var assetBase = html.dataset.assetBase || '/cases/assets/casey/';
  var assetExt = 'png';

  var TONE_KEY = 'casebook-tone';

  function readStoredTone() {
    try {
      var t = localStorage.getItem(TONE_KEY);
      if (['junior', 'mid', 'staff'].indexOf(t) !== -1) return t;
    } catch (e) {}
    return 'junior';
  }

  function voiceLineForTone(tone) {
    var voice = caseyData.voice;
    if (!voice || !voice.sections || !voice.sections.length) return null;
    var hook = voice.sections.filter(function (s) { return s.chapter === 'hook'; })[0];
    return hook && (hook[tone] || hook.junior) ? hook[tone] || hook.junior : null;
  }

  /* ── State ── */
  var currentTone = readStoredTone();
  var currentChapter = null;

  /* ── All coach cards (desktop aside + mobile dock) ── */
  var cards = document.querySelectorAll('.casey-coach__card');
  var bubbles = document.querySelectorAll('.casey-coach__bubble');
  var avatars = document.querySelectorAll('[data-casey-avatar]');

  /* ── Avatar path ── */
  function avatarSrc(tier, pose) {
    return assetBase + tier + '/' + (pose || 'idle') + '.' + assetExt;
  }

  function setAvatar(tier, pose, opts) {
    opts = opts || {};
    avatars.forEach(function (img) {
      if (opts.tierFade && !prm) {
        img.classList.remove('casey-tier-fade');
        void img.offsetWidth;
        img.classList.add('casey-tier-fade');
        setTimeout(function () { img.classList.remove('casey-tier-fade'); }, 280);
      }
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

  /* ── Action chips from casey.json actions array ── */
  function renderActionChips(chapter, tone) {
    var actionContainers = document.querySelectorAll('.casey-coach__actions');
    var actions = caseyData.actions || [];
    var chapterActions = actions.filter(function (a) { return a.chapter === chapter; });
    actionContainers.forEach(function (container) {
      container.innerHTML = '';
      var chips = chapterActions.length ? (chapterActions[0][tone] || chapterActions[0].junior || []) : [];
      if (!chips.length) { container.hidden = true; return; }
      chips.forEach(function (chip) {
        var el;
        if (chip.target) {
          /* Scroll-to-element chip */
          el = document.createElement('button');
          el.type = 'button';
          el.addEventListener('click', function () {
            var target = document.querySelector(chip.target);
            if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus({ preventScroll: true }); }
          });
        } else if (chip.href) {
          el = document.createElement('a');
          el.href = chip.href;
        } else {
          return;
        }
        el.className = 'casey-coach__chip';
        el.textContent = chip.label || '';
        container.appendChild(el);
      });
      container.hidden = container.children.length === 0;
    });
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
    var pose = 'idle';
    if (!prm) {
      if (chapterId === 'demo') pose = 'point';
      else if (chapterId === 'takeaway') pose = 'proud';
      else if (hint) pose = 'perk';
    }
    setAvatar(currentTone, pose);
    if (hint) setBubble(hint);
    renderActionChips(chapterId, currentTone);
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

  /* ── Demo state tracking: dispatch case-demo-fixed on broken→fixed transition ── */
  var lastDemoState = null;
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-demo-state]');
    if (!btn) return;
    var state = btn.dataset.demoState;
    if (state === 'fixed' && lastDemoState === 'broken') {
      document.dispatchEvent(new CustomEvent('case-demo-fixed'));
    }
    lastDemoState = state;
  });

  /* ── case-demo-fixed → celebrate → idle ── */
  document.addEventListener('case-demo-fixed', function () {
    if (prm) return;
    setAvatar(currentTone, 'celebrate');
    avatars.forEach(function (img) { img.classList.add('casey-bounce-once'); });
    setTimeout(function () {
      setAvatar(currentTone, 'idle');
      avatars.forEach(function (img) { img.classList.remove('casey-bounce-once'); });
    }, 600);
  });

  /* ── Listen for tone changes ── */
  document.addEventListener('casebook-tone-change', function (e) {
    var newTone = e.detail && e.detail.tone;
    if (!newTone) return;
    currentTone = newTone;
    setAvatar(newTone, 'idle', { tierFade: true });
    var hint = currentChapter ? getHint(currentChapter, newTone) : null;
    setBubble(hint || voiceLineForTone(newTone) || '');
    if (currentChapter) renderActionChips(currentChapter, newTone);
    if (interactionsCfg) applyMotionTokens(interactionsCfg, newTone);
  });

  /* ── Listen for color changes (cancel speech handled by casey-voice) ── */
  document.addEventListener('casebook-color-change', function () {
    /* Refresh avatar with same tier/pose in case CSS needs update */
    setAvatar(currentTone, prm ? 'idle' : (currentChapter === 'demo' ? 'point' : 'idle'));
  });

  /* ── Mobile dock: show after init ── */
  var dock = document.getElementById('casey-dock');
  if (dock) dock.hidden = false;

  /* Initial state — sync stored tone (case-scroll may have fired before this script) */
  setAvatar(currentTone, prm ? 'sleep' : 'idle');
  var initHint = voiceLineForTone(currentTone);
  if (initHint) setBubble(initHint);

  /* ── casey-interactions.json: tier labels, blink, motion tokens ── */
  var interactionsCfg = null;

  function applyMotionTokens(cfg, tier) {
    var motion = cfg.tierMotion && (cfg.tierMotion[tier] || cfg.tierMotion.junior);
    if (!motion) return;
    cards.forEach(function (card) {
      card.style.setProperty('--casey-breathe-duration', motion.breatheDurationSec + 's');
    });
  }

  var interactionsUrl = assetBase.replace(/\/?$/, '/') + 'casey-interactions.json';
  fetch(interactionsUrl)
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (cfg) {
      if (!cfg) return;
      interactionsCfg = cfg;
      if (cfg.tierLabels) {
        var labelEls = document.querySelectorAll('.casey-coach__name, [data-casey-tier-label]');
        labelEls.forEach(function (el) {
          var tier = el.closest('[data-casey-tier]') && el.closest('[data-casey-tier]').dataset.caseyTier;
          if (!tier) tier = currentTone;
          if (cfg.tierLabels[tier]) el.textContent = cfg.tierLabels[tier];
        });
      }
      /* Apply tier-driven motion tokens */
      applyMotionTokens(cfg, currentTone);
      var blinkRule = (cfg.interactions || []).filter(function (r) { return r.id === 'blink'; })[0];
      if (!blinkRule || prm) {
        /* No blink — add breathe for non-PRM */
        if (!prm) avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
        return;
      }
      avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
      function scheduleBlink() {
        var min = blinkRule.intervalMsMin || 4000;
        var max = blinkRule.intervalMsMax || 8000;
        var delay = min + Math.random() * (max - min);
        setTimeout(function () {
          avatars.forEach(function (img) { img.classList.remove('casey-breathing'); });
          setAvatar(currentTone, 'blink');
          setTimeout(function () {
            setAvatar(currentTone, 'idle');
            avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
            scheduleBlink();
          }, blinkRule.durationMs || 400);
        }, delay);
      }
      scheduleBlink();
    })
    .catch(function () { /* optional file */ });

}());
