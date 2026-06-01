/**
 * casey-companion.js — unified Casey brain: FSM, memory, surfaces.
 * Load before casey-coach.js / casey-hub.js / casey-library.js.
 */
(function initCaseyCompanionModule() {
  'use strict';

  var STORAGE_KEY = 'casebook-companion-v1';
  var TONE_KEY = 'casebook-tone';
  var VISITED_KEY = 'casebook-visited';

  var POSE_ALIAS = {
    'think-deep': 'think',
    'hi-five': 'celebrate',
  };

  var CHAPTER_POSES = {
    hook: 'perk',
    concept: 'think',
    'story-1': 'idle',
    'story-2': 'idle',
    'ui-strip': 'idle',
    demo: 'point',
    'fe-depth': 'think',
    references: 'read',
    takeaway: 'proud',
  };

  var interactionsCfg = null;
  var companionLines = null;
  var preloaded = {};
  var activeTimers = {};

  function readCompanionLines() {
    if (companionLines) return companionLines;
    var el = document.getElementById('casey-companion-lines');
    if (!el) return {};
    try {
      companionLines = JSON.parse(el.textContent);
    } catch (e) {
      companionLines = {};
    }
    return companionLines;
  }

  function lineAt(path, tone, vars) {
    var lines = readCompanionLines();
    var parts = path.split('.');
    var node = lines;
    for (var i = 0; i < parts.length; i++) {
      if (!node) return '';
      node = node[parts[i]];
    }
    if (!node) return '';
    var text = node[tone] || node.junior || '';
    if (vars && text) {
      Object.keys(vars).forEach(function (k) {
        text = text.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return text;
  }

  function defaultState() {
    return {
      v: 1,
      tone: 'junior',
      visitedHub: false,
      casesStarted: [],
      casesCompleted: [],
      libraryOpened: false,
      lastSlug: null,
      lastVisitAt: null,
      milestones: [],
      dismissedTips: [],
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var s = JSON.parse(raw);
      return Object.assign(defaultState(), s);
    } catch (e) {
      return defaultState();
    }
  }

  function saveState(state) {
    try {
      state.lastVisitAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* private mode */ }
  }

  function resetCompanion() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  if (typeof URLSearchParams !== 'undefined') {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get('resetCompanion') === '1') resetCompanion();
    } catch (e) { /* ignore */ }
  }

  function readTier() {
    try {
      var t = localStorage.getItem(TONE_KEY);
      if (['junior', 'mid', 'staff'].indexOf(t) !== -1) return t;
    } catch (e) { /* ignore */ }
    return 'junior';
  }

  function resolvePose(pose) {
    return POSE_ALIAS[pose] || pose || 'idle';
  }

  function avatarSrc(assetBase, ext, tier, pose) {
    var base = assetBase.replace(/\/?$/, '/');
    return base + tier + '/' + resolvePose(pose) + '.' + ext;
  }

  function preloadPose(assetBase, ext, tier, pose) {
    var url = avatarSrc(assetBase, ext, tier, pose);
    if (preloaded[url]) return preloaded[url];
    preloaded[url] = new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () { resolve(url); };
      img.src = url;
    });
    return preloaded[url];
  }

  function setImgPose(img, assetBase, ext, tier, pose, opts) {
    if (!img) return;
    opts = opts || {};
    var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var url = avatarSrc(assetBase, ext, tier, pose);

    function apply() {
      if (opts.tierFade && !prm) {
        img.classList.remove('casey-tier-fade', 'casey-pose-enter');
        void img.offsetWidth;
        img.classList.add('casey-tier-fade');
        setTimeout(function () { img.classList.remove('casey-tier-fade'); }, 280);
      } else if (!prm && img.getAttribute('src') && img.getAttribute('src') !== url) {
        img.classList.remove('casey-pose-enter');
        void img.offsetWidth;
        img.classList.add('casey-pose-enter');
        setTimeout(function () { img.classList.remove('casey-pose-enter'); }, 320);
      }
      img.src = url;
      if (opts.alt) img.alt = opts.alt;
    }

    if (opts.preload !== false && !prm) {
      preloadPose(assetBase, ext, tier, pose).then(apply);
    } else {
      apply();
    }
  }

  function setManyPoses(imgs, assetBase, ext, tier, pose, opts) {
    imgs.forEach(function (img) {
      setImgPose(img, assetBase, ext, tier, pose, opts);
    });
  }

  function applyMotionTokens(cfg, tier, cards) {
    var motion = cfg && cfg.tierMotion && (cfg.tierMotion[tier] || cfg.tierMotion.junior);
    if (!motion || !cards) return;
    cards.forEach(function (card) {
      card.style.setProperty('--casey-breathe-duration', motion.breatheDurationSec + 's');
      card.style.setProperty('--casey-bounce-px', (motion.bouncePx || 4) + 'px');
    });
  }

  function loadInteractions(assetBase) {
    if (interactionsCfg) return Promise.resolve(interactionsCfg);
    var url = assetBase.replace(/\/?$/, '/') + 'casey-interactions.json';
    return fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (cfg) {
        interactionsCfg = cfg;
        return cfg;
      })
      .catch(function () { return null; });
  }

  function recordEvent(type, detail) {
    detail = detail || {};
    var state = loadState();
    var slug = detail.slug;

    if (type === 'case-started' && slug) {
      if (state.casesStarted.indexOf(slug) === -1) state.casesStarted.push(slug);
      state.lastSlug = slug;
    }
    if (type === 'case-completed' && slug) {
      if (state.casesCompleted.indexOf(slug) === -1) state.casesCompleted.push(slug);
      if (state.milestones.indexOf('first-case-completed') === -1) {
        state.milestones.push('first-case-completed');
      }
      if (state.casesCompleted.length >= 5 && state.milestones.indexOf('five-cases') === -1) {
        state.milestones.push('five-cases');
      }
    }
    if (type === 'library-visit') state.libraryOpened = true;
    if (type === 'hub-visit') state.visitedHub = true;

    saveState(state);
    document.dispatchEvent(new CustomEvent('casey-companion-event', {
      detail: { type: type, state: state, slug: slug },
    }));
    return state;
  }

  function suggest(ctx) {
    ctx = ctx || {};
    var tone = ctx.tone || readTier();
    var state = loadState();
    var surface = ctx.surface || 'hub';
    var out = { line: '', pose: 'idle', actions: [] };

    if (surface === 'hub') {
      var completed = state.casesCompleted.length;
      if (completed >= 5) {
        out.line = lineAt('hub.progress5', tone);
        out.pose = 'celebrate';
      } else if (completed >= 1) {
        out.line = lineAt('hub.progress1', tone);
        out.pose = 'welcome';
      } else if (state.visitedHub) {
        out.line = lineAt('hub.returning', tone);
        out.pose = 'welcome';
      }
      if (ctx.filterCount === 0) {
        out.line = lineAt('hub.filterEmpty', tone);
        out.pose = 'support';
      } else if (typeof ctx.filterCount === 'number' && ctx.filterCount > 0 && ctx.track) {
        var nLabel = ctx.filterCount === 1 ? '' : 's';
        out.line = lineAt('hub.filterMatch', tone, { n: ctx.filterCount, nLabel: nLabel });
        out.pose = 'nod';
      }
      return out;
    }

    if (surface === 'case' && ctx.moment === 'completed') {
      out.line = lineAt('case.completed', tone);
      out.pose = 'proud';
      return out;
    }

    if (surface === 'case' && ctx.moment === 'demoIdle') {
      out.line = lineAt('case.demoIdle', tone);
      out.pose = 'think';
      return out;
    }

    if (surface === 'library') {
      out.line = state.libraryOpened
        ? lineAt('library.filtered', tone)
        : lineAt('library.firstVisit', tone);
      out.pose = 'read';
      return out;
    }

    return out;
  }

  function scheduleBlink(avatars, assetBase, ext, getTier, cards) {
    var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prm || !interactionsCfg) return;
    var blinkRule = (interactionsCfg.interactions || []).filter(function (r) {
      return r.id === 'blink';
    })[0];
    if (!blinkRule) {
      avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
      return;
    }
    avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
    function run() {
      var min = blinkRule.intervalMsMin || 4000;
      var max = blinkRule.intervalMsMax || 8000;
      var delay = min + Math.random() * (max - min);
      activeTimers.blink = setTimeout(function () {
        var tier = getTier();
        avatars.forEach(function (img) { img.classList.remove('casey-breathing'); });
        setManyPoses(avatars, assetBase, ext, tier, 'blink', { preload: false });
        activeTimers.blinkEnd = setTimeout(function () {
          setManyPoses(avatars, assetBase, ext, tier, 'idle', { preload: false });
          avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
          run();
        }, blinkRule.durationMs || 400);
      }, delay);
    }
    run();
  }

  function chapterPose(chapterId, hasHint, prm) {
    if (prm) return 'sleep';
    if (CHAPTER_POSES[chapterId]) return CHAPTER_POSES[chapterId];
    if (hasHint) return 'perk';
    return 'idle';
  }

  function renderActionChips(caseyData, chapter, tone, containers) {
    if (!containers || !containers.length) return;
    var actions = (caseyData && caseyData.actions) || [];
    var chapterActions = actions.filter(function (a) { return a.chapter === chapter; });
    var chips = chapterActions.length
      ? (chapterActions[0][tone] || chapterActions[0].junior || [])
      : [];

    containers.forEach(function (container) {
      container.innerHTML = '';
      if (!chips.length) {
        container.hidden = true;
        return;
      }
      chips.forEach(function (chip) {
        var el;
        if (chip.target) {
          el = document.createElement('button');
          el.type = 'button';
          el.addEventListener('click', function () {
            var target = document.querySelector(chip.target);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (target.focus) target.focus({ preventScroll: true });
            }
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

  function getHint(caseyData, chapter, tone) {
    if (!caseyData) return null;
    var hints = caseyData.hints || [];
    var i;
    for (i = 0; i < hints.length; i++) {
      if (hints[i].chapter === chapter) return hints[i][tone] || hints[i].junior || null;
    }
    var anecdotes = caseyData.anecdotes || [];
    for (i = 0; i < anecdotes.length; i++) {
      if (anecdotes[i].chapter === chapter) return anecdotes[i][tone] || null;
    }
    return null;
  }

  function voiceLineForChapter(caseyData, chapter, tone) {
    var voice = caseyData && caseyData.voice;
    if (!voice || !voice.sections) return null;
    var section = voice.sections.filter(function (s) { return s.chapter === chapter; })[0];
    if (!section) {
      section = voice.sections[0];
    }
    return section ? (section[tone] || section.junior || null) : null;
  }

  function flashConfetti(root) {
    var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prm || !root) return;
    root.classList.add('casey-milestone-flash');
    setTimeout(function () { root.classList.remove('casey-milestone-flash'); }, 700);
  }

  /* ── Surface: case coach ── */
  function initCase(opts) {
    var caseyData = opts.caseyData;
    if (!caseyData) return null;

    var html = document.documentElement;
    var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var assetBase = html.dataset.assetBase || '/cases/assets/casey/';
    var assetExt = 'png';
    var pathPrefix = html.dataset.pathPrefix || '/cases/';

    var currentTone = readTier();
    var currentChapter = null;
    var overridePoseUntil = 0;
    var takeawayTimer = null;
    var demoIdleTimer = null;
    var slug = caseyData.slug || (window.location.pathname.split('/').filter(Boolean).pop());

    var cards = document.querySelectorAll('.casey-coach__card');
    var bubbles = document.querySelectorAll('.casey-coach__bubble');
    var avatars = document.querySelectorAll('[data-casey-avatar]');
    var actionContainers = document.querySelectorAll('.casey-coach__actions');
    var dock = document.getElementById('casey-dock');

    recordEvent('case-started', { slug: slug });

    function setBubble(text, animate) {
      bubbles.forEach(function (b) {
        if (animate && text && !prm) {
          b.classList.remove('casey-bubble-enter');
          void b.offsetWidth;
          b.classList.add('casey-bubble-enter');
          setTimeout(function () { b.classList.remove('casey-bubble-enter'); }, 350);
        }
        b.textContent = text || '';
      });
    }

    function setPose(pose, opts) {
      opts = opts || {};
      if (Date.now() < overridePoseUntil && !opts.force) return;
      setManyPoses(avatars, assetBase, assetExt, currentTone, pose, opts);
      cards.forEach(function (card) {
        card.dataset.caseyTier = currentTone;
        card.dataset.caseyState = resolvePose(pose);
      });
    }

    function applyTierLabels(cfg) {
      if (!cfg || !cfg.tierLabels) return;
      document.querySelectorAll('.casey-coach__name, [data-casey-tier-label]').forEach(function (el) {
        var tier = currentTone;
        var parent = el.closest('[data-casey-tier]');
        if (parent && parent.dataset.caseyTier) tier = parent.dataset.caseyTier;
        if (cfg.tierLabels[tier]) el.textContent = cfg.tierLabels[tier];
      });
    }

    function onChapterEnter(chapterId) {
      if (currentChapter === chapterId) return;
      currentChapter = chapterId;
      clearTimeout(demoIdleTimer);

      var hint = getHint(caseyData, chapterId, currentTone);
      var pose = chapterPose(chapterId, !!hint, prm);
      preloadPose(assetBase, assetExt, currentTone, pose);
      if (chapterId === 'demo' && !prm) {
        preloadPose(assetBase, assetExt, currentTone, 'support');
        preloadPose(assetBase, assetExt, currentTone, 'celebrate');
      }

      setPose(pose, { preload: false });
      if (hint) setBubble(hint, true);
      else setBubble(voiceLineForChapter(caseyData, chapterId, currentTone) || '', true);
      renderActionChips(caseyData, chapterId, currentTone, actionContainers);

      if (chapterId === 'demo' && !prm) {
        demoIdleTimer = setTimeout(function () {
          if (currentChapter !== 'demo') return;
          var idle = suggest({ surface: 'case', moment: 'demoIdle', tone: currentTone });
          if (idle.line) setBubble(idle.line, true);
          setPose('curious');
        }, 30000);
      }

      if (chapterId === 'takeaway') {
        clearTimeout(takeawayTimer);
        takeawayTimer = setTimeout(function () {
          if (currentChapter !== 'takeaway') return;
          recordEvent('case-completed', { slug: slug });
          var done = suggest({ surface: 'case', moment: 'completed', tone: currentTone });
          if (done.line) setBubble(done.line, true);
          setPose('proud', { force: true });
          flashConfetti(document.querySelector('.casebook-case'));
          document.dispatchEvent(new CustomEvent('case-case-completed', { detail: { slug: slug } }));
          var state = loadState();
          if (state.milestones.indexOf('five-cases') !== -1) {
            setPose('celebrate', { force: true });
            avatars.forEach(function (img) { img.classList.add('casey-bounce-once'); });
          }
        }, 2000);
      }
    }

    if ('IntersectionObserver' in window) {
      var pendingChapter = null;
      var debounceTimer = null;
      var io = new IntersectionObserver(function (entries) {
        var best = null;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { id: entry.target.dataset.chapter, ratio: entry.intersectionRatio };
          }
        });
        if (!best || best.ratio < 0.3) return;
        pendingChapter = best.id;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          if (pendingChapter) onChapterEnter(pendingChapter);
        }, 150);
      }, { threshold: [0.3, 0.5, 0.7] });
      document.querySelectorAll('.case-chapter[data-chapter]').forEach(function (ch) {
        io.observe(ch);
      });
    }

    var lastDemoState = null;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-demo-state]');
      if (!btn) return;
      var state = btn.dataset.demoState;
      clearTimeout(demoIdleTimer);
      if (state === 'broken' && !prm) {
        overridePoseUntil = Date.now() + 1200;
        setPose('support', { force: true });
        setTimeout(function () {
          overridePoseUntil = 0;
          if (currentChapter === 'demo') setPose('point');
          else setPose('idle');
        }, 1200);
      }
      if (state === 'fixed' && lastDemoState === 'broken') {
        document.dispatchEvent(new CustomEvent('case-demo-fixed'));
      }
      lastDemoState = state;
    });

    document.addEventListener('case-demo-fixed', function () {
      if (prm) return;
      overridePoseUntil = Date.now() + 600;
      setPose('celebrate', { force: true });
      avatars.forEach(function (img) { img.classList.add('casey-bounce-once'); });
      setTimeout(function () {
        overridePoseUntil = 0;
        setPose(currentChapter === 'demo' ? 'point' : 'idle');
        avatars.forEach(function (img) { img.classList.remove('casey-bounce-once'); });
      }, 600);
    });

    document.addEventListener('casebook-tone-change', function (e) {
      var newTone = e.detail && e.detail.tone;
      if (!newTone) return;
      currentTone = newTone;
      setPose('idle', { tierFade: true, force: true });
      var hint = currentChapter ? getHint(caseyData, currentChapter, newTone) : null;
      var toneLine = lineAt('case.toneSwitch', newTone);
      setBubble(hint || toneLine || voiceLineForChapter(caseyData, currentChapter || 'hook', newTone) || '');
      if (currentChapter) renderActionChips(caseyData, currentChapter, newTone, actionContainers);
      if (interactionsCfg) applyMotionTokens(interactionsCfg, newTone, cards);
    });

    document.addEventListener('casebook-color-change', function () {
      setPose(prm ? 'sleep' : (currentChapter === 'demo' ? 'point' : 'idle'), { force: true });
    });

    if (dock) dock.hidden = false;
    setPose(prm ? 'sleep' : 'idle');
    var initLine = voiceLineForChapter(caseyData, 'hook', currentTone);
    if (initLine) setBubble(initLine);

    loadInteractions(assetBase).then(function (cfg) {
      applyTierLabels(cfg);
      applyMotionTokens(cfg, currentTone, cards);
      scheduleBlink(avatars, assetBase, assetExt, function () { return currentTone; }, cards);
    });

    return { setPose: setPose, getChapter: function () { return currentChapter; } };
  }

  /* ── Surface: hub ── */
  function initHub(opts) {
    var hubEl = document.querySelector('[data-casey-hub]');
    if (!hubEl) return null;

    var hubData = opts.hubData || {};
    var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
    var assetExt = 'png';
    var pathPrefix = document.documentElement.dataset.pathPrefix || '/cases/';

    var avatar = hubEl.querySelector('[data-casey-hub-avatar]');
    var greetingEl = document.getElementById('casey-hub-greeting');
    var tierLabelEl = hubEl.querySelector('[data-casey-hub-tier-label]');
    var actionsEl = document.getElementById('casey-hub-actions');
    var flagshipSlug = hubEl.dataset.flagshipSlug || opts.flagshipSlug || '';

    var currentTier = readTier();
    var greetingIdx = 0;
    var rotateTimer = null;
    var state = loadState();

    recordEvent('hub-visit');

    function greetings(tier) {
      var g = hubData.greetings;
      return (g && (g[tier] || g.junior)) || [];
    }

    function setGreetingText(text) {
      if (!greetingEl || !text) return;
      greetingEl.classList.remove('casey-bubble-enter');
      if (!prm) {
        void greetingEl.offsetWidth;
        greetingEl.classList.add('casey-bubble-enter');
        setTimeout(function () { greetingEl.classList.remove('casey-bubble-enter'); }, 350);
      }
      greetingEl.textContent = text;
    }

    function pickInitialGreeting(tier) {
      var completed = state.casesCompleted.length;
      if (completed >= 5) return lineAt('hub.progress5', tier) || greetings(tier)[0];
      if (completed >= 1) return lineAt('hub.progress1', tier) || greetings(tier)[0];
      var firstVisit;
      try { firstVisit = !localStorage.getItem(VISITED_KEY); } catch (e) { firstVisit = true; }
      if (firstVisit) {
        var ctx = (hubData.contextual || []).filter(function (c) { return c.when === 'first-visit'; })[0];
        if (ctx && ctx[tier]) {
          try { localStorage.setItem(VISITED_KEY, '1'); } catch (e) { /* ignore */ }
          return ctx[tier];
        }
        try { localStorage.setItem(VISITED_KEY, '1'); } catch (e) { /* ignore */ }
      }
      if (state.visitedHub || state.casesStarted.length) {
        return lineAt('hub.returning', tier) || greetings(tier)[0];
      }
      return greetings(tier)[0];
    }

    function renderHubActions() {
      if (!actionsEl) return;
      actionsEl.innerHTML = '';
      var items = [];
      var continueSlug = state.lastSlug;
      if (continueSlug && state.casesCompleted.indexOf(continueSlug) === -1) {
        items.push({
          href: pathPrefix + continueSlug + '/',
          label: 'Continue last case',
          primary: true,
        });
      } else if (flagshipSlug) {
        items.push({
          href: pathPrefix + flagshipSlug + '/',
          label: 'Start flagship case',
          primary: true,
        });
      }
      items.push({ href: pathPrefix + 'library/', label: 'Reading library' });
      items.push({ href: pathPrefix + 'about/', label: 'How this works' });
      if (state.casesCompleted.length >= 1) {
        items.push({ href: pathPrefix + 'library/', label: 'War stories library' });
      }

      items.slice(0, 3).forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = item.href;
        a.className = 'casey-hub__action' + (item.primary ? ' casey-hub__action--primary' : '');
        a.textContent = item.label;
        a.addEventListener('click', function () {
          if (!prm && avatar) {
            setImgPose(avatar, assetBase, assetExt, currentTier, 'perk', { preload: false });
            setTimeout(function () {
              setImgPose(avatar, assetBase, assetExt, currentTier, 'wave', { preload: false });
            }, 380);
          }
        });
        li.appendChild(a);
        actionsEl.appendChild(li);
      });
    }

    var visited;
    try { visited = !!localStorage.getItem(VISITED_KEY); } catch (e) { visited = false; }
    var hubPose = prm ? 'sleep' : (visited ? 'welcome' : 'present');
    if (avatar) {
      setImgPose(avatar, assetBase, assetExt, currentTier, hubPose, {
        alt: 'Casey, ' + currentTier + ' developer kitten',
      });
    }
    if (tierLabelEl && interactionsCfg && interactionsCfg.tierLabels) {
      tierLabelEl.textContent = interactionsCfg.tierLabels[currentTier];
    }
    setGreetingText(pickInitialGreeting(currentTier));
    renderHubActions();

    function rotateGreeting() {
      var g = greetings(currentTier);
      if (g.length < 2) return;
      greetingIdx = (greetingIdx + 1) % g.length;
      setGreetingText(g[greetingIdx]);
    }

    function startRotation() {
      if (prm) return;
      if (rotateTimer) clearInterval(rotateTimer);
      rotateTimer = setInterval(function () {
        if (!document.hidden) rotateGreeting();
      }, 30000);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rotateTimer) clearInterval(rotateTimer);
      } else {
        startRotation();
      }
    });
    startRotation();

    document.addEventListener('casebook-tone-change', function (e) {
      var newTier = e.detail && e.detail.tone;
      if (!newTier || newTier === currentTier) return;
      currentTier = newTier;
      if (avatar) setImgPose(avatar, assetBase, assetExt, newTier, visited ? 'welcome' : 'present', { tierFade: true });
      if (tierLabelEl && interactionsCfg && interactionsCfg.tierLabels) {
        tierLabelEl.textContent = interactionsCfg.tierLabels[newTier];
      }
      setGreetingText(lineAt('hub.toneSwitch', newTier) || pickInitialGreeting(newTier));
      hubEl.dataset.caseyTier = newTier;
    });

    document.addEventListener('casey-hub-filter', function (e) {
      var d = e.detail || {};
      var sug = suggest({
        surface: 'hub',
        tone: currentTier,
        filterCount: d.count,
        track: d.track,
      });
      if (sug.line) setGreetingText(sug.line);
      if (avatar && sug.pose) {
        setImgPose(avatar, assetBase, assetExt, currentTier, sug.pose, { preload: false });
      }
    });

    loadInteractions(assetBase).then(function (cfg) {
      if (tierLabelEl && cfg && cfg.tierLabels) {
        tierLabelEl.textContent = cfg.tierLabels[currentTier];
      }
      if (avatar && !prm) avatar.classList.add('casey-breathing');
    });

    return {};
  }

  /* ── Surface: library ── */
  function initLibrary(opts) {
    var root = document.querySelector('[data-casey-library]');
    if (!root) return null;

    var data = opts.libraryData || {};
    var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
    var assetExt = 'png';
    var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var avatar = root.querySelector('[data-casey-library-avatar]');
    var lineEl = document.getElementById('casey-library-line');
    var labelEl = root.querySelector('[data-casey-library-tier-label]');
    var current = readTier();

    recordEvent('library-visit');

    function setTier(tier) {
      if (avatar) {
        setImgPose(avatar, assetBase, assetExt, tier, 'read', {
          tierFade: !prm,
          alt: 'Casey reading the library guide',
        });
        if (!prm) avatar.classList.add('casey-breathing');
      }
      if (labelEl && interactionsCfg && interactionsCfg.tierLabels) {
        labelEl.textContent = interactionsCfg.tierLabels[tier];
      } else if (labelEl) {
        labelEl.textContent = 'Casey · ' + tier.charAt(0).toUpperCase() + tier.slice(1) + ' dev';
      }
      var state = loadState();
      var line = state.libraryOpened
        ? (lineAt('library.filtered', tier) || (data.lines && data.lines[tier]))
        : (lineAt('library.firstVisit', tier) || (data.lines && data.lines[tier]));
      if (lineEl && line) lineEl.textContent = line;
      root.dataset.caseyTier = tier;
    }

    setTier(current);

    document.addEventListener('casebook-tone-change', function (e) {
      var t = e.detail && e.detail.tone;
      if (!t || t === current) return;
      current = t;
      setTier(t);
    });

    loadInteractions(assetBase).then(function (cfg) {
      interactionsCfg = cfg;
      setTier(current);
    });

    return {};
  }

  /* ── Surface: about (one-time bubble) ── */
  function initAbout() {
    var tipKey = 'about-tone-hint';
    var state = loadState();
    if (state.dismissedTips.indexOf(tipKey) !== -1) return null;

    var tier = readTier();
    var line = lineAt('about.once', tier);
    if (!line) return null;

    var wrap = document.querySelector('.casebook-about');
    if (!wrap) return null;

    var bubble = document.createElement('aside');
    bubble.className = 'casey-about-bubble';
    bubble.setAttribute('aria-label', 'Casey introduction');
    bubble.innerHTML =
      '<img class="casey-about-bubble__img" src="' +
      (document.documentElement.dataset.assetBase || '/cases/assets/casey/') +
      tier + '/present.png" width="64" height="64" alt="" />' +
      '<p class="casey-about-bubble__text"></p>' +
      '<button type="button" class="casey-about-bubble__dismiss">Got it</button>';
    bubble.querySelector('.casey-about-bubble__text').textContent = line;
    wrap.insertBefore(bubble, wrap.firstChild);

    bubble.querySelector('.casey-about-bubble__dismiss').addEventListener('click', function () {
      bubble.remove();
      state = loadState();
      if (state.dismissedTips.indexOf(tipKey) === -1) state.dismissedTips.push(tipKey);
      saveState(state);
    });

    return {};
  }

  /* ── Surface: companies mini strip ── */
  function initCompanies() {
    var main = document.querySelector('.casebook-hub--companies, .casebook-hub');
    if (!main || document.querySelector('[data-casey-companies]')) return null;

    var tier = readTier();
    var line = lineAt('companies.mini', tier);
    if (!line) return null;

    var strip = document.createElement('div');
    strip.className = 'casey-companies-mini';
    strip.setAttribute('data-casey-companies', 'true');
    strip.innerHTML =
      '<img src="' +
      (document.documentElement.dataset.assetBase || '/cases/assets/casey/') +
      tier + '/read.png" width="48" height="48" alt="" class="casey-companies-mini__img" />' +
      '<p class="casey-companies-mini__line"></p>';
    strip.querySelector('.casey-companies-mini__line').textContent = line;
    main.insertBefore(strip, main.firstChild);
    return {};
  }

  window.CaseyCompanion = {
    init: function (opts) {
      opts = opts || {};
      var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
      readCompanionLines();
      var p = loadInteractions(assetBase);
      var surface = opts.surface;
      if (surface === 'case') {
        return p.then(function () { return initCase(opts); });
      }
      if (surface === 'hub') {
        return p.then(function () { return initHub(opts); });
      }
      if (surface === 'library') {
        return p.then(function () { return initLibrary(opts); });
      }
      if (surface === 'about') {
        return p.then(function () { return initAbout(); });
      }
      if (surface === 'companies') {
        return p.then(function () { return initCompanies(); });
      }
      return p;
    },
    getState: loadState,
    saveState: saveState,
    recordEvent: recordEvent,
    suggest: suggest,
    resetCompanion: resetCompanion,
    preloadPose: preloadPose,
    chapterPose: chapterPose,
    resolvePose: resolvePose,
    avatarSrc: avatarSrc,
    setImgPose: setImgPose,
    getInteractions: function () { return interactionsCfg; },
    loadInteractions: loadInteractions,
  };
}());
