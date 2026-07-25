/**
 * casey-companion.js — unified Casey brain: FSM, memory, surfaces.
 * Load before casey-coach.js / casey-hub.js / casey-library.js — and
 * after casebook-progress-store.js, whose adapter backs the progress
 * blob read/written below (falls back to direct localStorage if that
 * script didn't load, so load order failures degrade rather than break).
 */
(function initCaseyCompanionModule() {
  'use strict';

  var STORAGE_KEY = 'casebook-companion-v1';
  var TONE_KEY = 'casebook-tone';
  var VISITED_KEY = 'casebook-visited';

  var progressStore = window.CasebookProgressStore || {
    get: function (key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  var POSE_ALIAS = {
    'think-deep': 'think',
    'hi-five': 'celebrate',
  };

  var CHAPTER_POSES = {
    hook: 'perk',
    concept: 'think',
    'story-1': 'curious',
    'story-2': 'curious',
    'ui-strip': 'point',
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
      previousVisitAt: null,
      milestones: [],
      dismissedTips: [],
      caseyIntensity: 'full',
      caseProgress: {},
      confettiSeenSlugs: [],
    };
  }

  function loadState() {
    try {
      var raw = progressStore.get(STORAGE_KEY);
      if (!raw) return defaultState();
      var s = JSON.parse(raw);
      var merged = Object.assign(defaultState(), s);
      if (!merged.caseyIntensity || ['full', 'quiet', 'off'].indexOf(merged.caseyIntensity) === -1) {
        merged.caseyIntensity = 'full';
      }
      if (!merged.caseProgress || typeof merged.caseProgress !== 'object') merged.caseProgress = {};
      if (!Array.isArray(merged.confettiSeenSlugs)) merged.confettiSeenSlugs = [];
      return merged;
    } catch (e) {
      return defaultState();
    }
  }

  function getIntensity() {
    return loadState().caseyIntensity || 'full';
  }

  function shouldShowCaseyBehavior(kind) {
    var intensity = getIntensity();
    if (intensity === 'off') {
      return kind === 'hubAvatar';
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (kind === 'confetti' || kind === 'lottie' || kind === 'rotate') return false;
    }
    if (intensity === 'quiet') {
      if (kind === 'confetti' || kind === 'lottie' || kind === 'rotate') return false;
    }
    if (intensity === 'off') return false;
    return true;
  }

  function recordProgress(slug, chapter, pct) {
    if (!slug) return;
    var state = loadState();
    state.caseProgress[slug] = {
      chapter: chapter || 'hook',
      pct: Math.max(0, Math.min(1, pct || 0)),
      at: Date.now(),
    };
    saveState(state);
  }

  function saveState(state) {
    state.lastVisitAt = new Date().toISOString();
    progressStore.set(STORAGE_KEY, JSON.stringify(state));
  }

  function resetCompanion() {
    progressStore.remove(STORAGE_KEY);
    // Reading level lives in a separate store (casebook-tone.js) from
    // everything else this function clears — without this, "Reset memory"
    // silently left the tier picker on whatever the reader last chose,
    // even though the confirm prompt promises to reset Casey wholesale.
    if (window.CasebookTone) window.CasebookTone.setTone('junior');
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

  function assetVersion() {
    return document.documentElement.dataset.apBuildId || '';
  }

  function avatarSrc(assetBase, ext, tier, pose) {
    var base = assetBase.replace(/\/?$/, '/');
    var url = base + tier + '/' + resolvePose(pose) + '.' + ext;
    var v = assetVersion();
    return v ? url + '?v=' + v : url;
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

  var frameSwapToken = {};

  function ensureAvatarFrame(img) {
    if (!img) return img;
    var parent = img.parentElement;
    if (parent && parent.classList.contains('casey-avatar-frame')) {
      img.classList.add('casey-avatar-frame__img');
      img.dataset.caseyFrameReady = '1';
      return img;
    }
    var frame = document.createElement('div');
    frame.className = 'casey-avatar-frame';
    if (img.classList.contains('casey-hub__img')) frame.classList.add('casey-hub__avatar-frame');
    if (img.classList.contains('casey-coach__avatar')) frame.classList.add('casey-coach__avatar-frame');
    if (img.classList.contains('casey-library__img')) frame.classList.add('casey-library__avatar-frame');
    if (img.classList.contains('hub-empty__img')) frame.classList.add('hub-empty__avatar');
    var out = document.createElement('img');
    out.className = img.className + ' casey-avatar-frame__img';
    out.width = img.width || 52;
    out.height = img.height || 52;
    out.alt = img.alt || '';
    out.dataset.caseyAvatar = img.dataset.caseyAvatar || 'true';
    if (img.dataset.caseyHubAvatar) out.dataset.caseyHubAvatar = 'true';
    if (img.dataset.caseyLibraryAvatar) out.dataset.caseyLibraryAvatar = 'true';
    if (img.dataset.caseyEmptyAvatar) out.dataset.caseyEmptyAvatar = 'true';
    out.src = img.src;
    frame.appendChild(out);
    var picture = img.closest('picture');
    var mountTarget = picture || img;
    if (mountTarget.parentNode) mountTarget.parentNode.replaceChild(frame, mountTarget);
    out.dataset.caseyFrameReady = '1';
    return out;
  }

  function primaryImgInFrame(frame) {
    if (!frame) return null;
    var primary = frame.querySelector('img.casey-avatar-frame__img:not(.casey-avatar-frame__img--incoming)');
    if (primary) return primary;
    var imgs = frame.querySelectorAll('img');
    return imgs.length ? imgs[0] : null;
  }

  function clearIncomingLayers(frame, keep) {
    if (!frame) return;
    frame.querySelectorAll('img.casey-avatar-frame__img--incoming').forEach(function (el) {
      if (el !== keep) el.remove();
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function onPrefersReducedMotionChange(handler) {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
    return function () {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }

  function setImgPose(img, assetBase, ext, tier, pose, opts) {
    if (!img) return;
    img = ensureAvatarFrame(img);
    opts = opts || {};
    var frame = img.closest('.casey-avatar-frame');
    img = primaryImgInFrame(frame) || img;
    if (frame && tier) frame.dataset.caseyTier = tier;

    if (!frame.dataset.caseyFrameId) {
      frame.dataset.caseyFrameId = 'cf-' + String(Math.random()).slice(2, 10);
    }
    var frameId = frame.dataset.caseyFrameId;
    var url = avatarSrc(assetBase, ext, tier, pose);
    var token = (frameSwapToken[frameId] || 0) + 1;
    frameSwapToken[frameId] = token;
    var prm = prefersReducedMotion();
    var allowCrossfade = !prm && opts.crossfade !== false && opts.tierFade !== true;

    function sameUrl(a, b) {
      try {
        return new URL(a, location.href).pathname + new URL(a, location.href).search
          === new URL(b, location.href).pathname + new URL(b, location.href).search;
      } catch (_) {
        return false;
      }
    }

    function finishPrimary() {
      if (opts.alt) img.alt = opts.alt;
      img.classList.remove(
        'casey-avatar-fade-swap',
        'casey-avatar-frame__img--out',
        'casey-avatar-frame__img--visible'
      );
      img.style.opacity = '';
      if (opts.enter && !prm) {
        img.classList.remove('casey-pose-enter');
        void img.offsetWidth;
        img.classList.add('casey-pose-enter');
        setTimeout(function () { img.classList.remove('casey-pose-enter'); }, 300);
      }
      if (opts.tierFade && !prm) {
        img.classList.remove('casey-tier-fade');
        void img.offsetWidth;
        img.classList.add('casey-tier-fade');
        setTimeout(function () { img.classList.remove('casey-tier-fade'); }, 280);
      }
    }

    function commitHard() {
      if (frameSwapToken[frameId] !== token) return;
      clearIncomingLayers(frame, null);
      if (img.src && sameUrl(img.src, url)) {
        finishPrimary();
        return;
      }
      img.src = url;
      if (img.decode) img.decode().catch(function () {});
      finishPrimary();
    }

    function commitCrossfade() {
      if (frameSwapToken[frameId] !== token) return;
      if (!img.src || sameUrl(img.src, url)) {
        finishPrimary();
        return;
      }
      clearIncomingLayers(frame, null);
      var incoming = document.createElement('img');
      incoming.className = img.className
        .replace(/\bcasey-avatar-frame__img--incoming\b/g, '')
        .trim();
      if (incoming.className.indexOf('casey-avatar-frame__img') === -1) {
        incoming.className += ' casey-avatar-frame__img';
      }
      incoming.classList.add(
        'casey-avatar-frame__img--incoming',
        'casey-avatar-fade-swap'
      );
      incoming.width = img.width || 52;
      incoming.height = img.height || 52;
      incoming.alt = '';
      incoming.setAttribute('aria-hidden', 'true');
      incoming.style.opacity = '0';
      incoming.src = url;
      frame.appendChild(incoming);

      function swap() {
        if (frameSwapToken[frameId] !== token) {
          incoming.remove();
          return;
        }
        img.classList.add('casey-avatar-fade-swap', 'casey-avatar-frame__img--out');
        incoming.classList.add('casey-avatar-frame__img--visible');
        img.style.opacity = '0';
        incoming.style.opacity = '1';
        setTimeout(function () {
          if (frameSwapToken[frameId] !== token) {
            incoming.remove();
            return;
          }
          img.src = url;
          img.style.opacity = '';
          finishPrimary();
          incoming.remove();
        }, 230);
      }

      if (incoming.decode) {
        incoming.decode().then(swap).catch(swap);
      } else {
        incoming.onload = swap;
        incoming.onerror = commitHard;
      }
    }

    function commit() {
      if (allowCrossfade) commitCrossfade();
      else commitHard();
    }

    if (opts.preload === false) {
      commit();
      return;
    }
    var probe = new Image();
    probe.onload = commit;
    probe.onerror = commitHard;
    probe.src = url;
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

  // Numeric-count milestones beyond the first case (which has its own
  // always-on-completion celebration, handled separately). `linePath` is
  // the companion-lines.json key read via lineAt() when a reader crosses
  // that count for the first time.
  var COUNT_MILESTONES = [
    { count: 5, id: 'five-cases', linePath: 'milestones.fiveCases' },
    { count: 10, id: 'ten-cases', linePath: 'milestones.tenCases' },
    { count: 20, id: 'twenty-cases', linePath: 'milestones.twentyCases' },
  ];

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
      COUNT_MILESTONES.forEach(function (m) {
        if (state.casesCompleted.length >= m.count && state.milestones.indexOf(m.id) === -1) {
          state.milestones.push(m.id);
        }
      });
      // Populates the "new shape" caseProgress[slug].completedAt that
      // casey-guide.js's _recentStreak()/_completedCount() already read
      // defensively (with a fallback to the legacy casesCompleted array
      // when absent) — until this line, nothing ever wrote it, so the
      // streak-based hub greeting variant could never fire.
      state.caseProgress[slug] = Object.assign({}, state.caseProgress[slug], {
        completedAt: new Date().toISOString(),
      });
    }
    if (type === 'library-visit') state.libraryOpened = true;
    if (type === 'hub-visit') {
      state.visitedHub = true;
      // The prefs panel's "Visited the hub" milestone row (casey-companion-prefs.js)
      // reads state.milestones, not state.visitedHub — without this push it could
      // never flip to done no matter how many times the hub was visited.
      if (state.milestones.indexOf('hub-visit') === -1) {
        state.milestones.push('hub-visit');
      }
      // saveState() below stamps lastVisitAt to right now — capture the
      // PRIOR value first so a long-absence greeting has something to
      // compare against. Without this, lastVisitAt would always read as
      // "just now" by the time anything downstream tries to use it.
      state.previousVisitAt = state.lastVisitAt;
    }

    saveState(state);
    document.dispatchEvent(new CustomEvent('casey-companion-event', {
      detail: { type: type, state: state, slug: slug },
    }));
    return state;
  }

  // Fixed-interval review ladder (not full spaced-repetition — a case is
  // "due" once per interval, in a 1-day window after it elapses, then
  // drops off the ladder after the last interval). Deliberately simple:
  // most of the value of spaced repetition for a fading-technical-detail
  // use case comes from "revisit at all," not from a difficulty-adjusted
  // schedule.
  var REVIEW_INTERVALS_MS = [7, 30, 90].map(function (days) { return days * 86400000; });

  /**
   * Returns the slugs of completed cases currently due for review — i.e.
   * caseProgress[slug].completedAt is 7, 30, or 90 days old (within a
   * 1-day catch window so a missed visit doesn't silently skip the slot).
   * `now` is injectable for tests; defaults to Date.now().
   */
  function dueForReview(caseProgress, now) {
    now = now || Date.now();
    var due = [];
    Object.keys(caseProgress || {}).forEach(function (slug) {
      var entry = caseProgress[slug];
      if (!entry || !entry.completedAt) return;
      var age = now - new Date(entry.completedAt).getTime();
      var isDue = REVIEW_INTERVALS_MS.some(function (interval) {
        return age >= interval && age < interval + 86400000;
      });
      if (isDue) due.push(slug);
    });
    return due;
  }

  /** First due-for-review slug with a known title, or null. Used to pick a single hub nudge. */
  function pickReviewDueSlug(caseProgress, titles, now) {
    var due = dueForReview(caseProgress, now);
    for (var i = 0; i < due.length; i++) {
      if (titles && titles[due[i]]) return due[i];
    }
    return null;
  }

  function suggest(ctx) {
    ctx = ctx || {};
    var tone = ctx.tone || readTier();
    var state = loadState();
    var surface = ctx.surface || 'hub';
    var out = { line: '', pose: 'idle', actions: [] };

    if (surface === 'hub') {
      if (ctx.track && ctx.filterCount === 0) {
        out.line = lineAt('hub.filterEmpty', tone);
        out.pose = 'curious';
        return out;
      }
      if (ctx.track && typeof ctx.filterCount === 'number' && ctx.filterCount > 0) {
        var nLabel = ctx.filterCount === 1 ? '' : 's';
        out.line = lineAt('hub.filterMatch', tone, { n: ctx.filterCount, nLabel: nLabel });
        out.pose = 'nod';
        return out;
      }
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
      var reviewSlug = pickReviewDueSlug(state.caseProgress, readCaseTitles());
      if (reviewSlug) {
        out.line = lineAt('hub.reviewDue', tone, { title: readCaseTitles()[reviewSlug] });
        out.pose = 'point';
        out.reviewSlug = reviewSlug;
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
      out.pose = 'curious';
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

  function clearBlinkTimers() {
    if (activeTimers.blink) clearTimeout(activeTimers.blink);
    if (activeTimers.blinkEnd) clearTimeout(activeTimers.blinkEnd);
    activeTimers.blink = null;
    activeTimers.blinkEnd = null;
  }

  function scheduleBlink(avatars, assetBase, ext, getTier, cards, getRestPose) {
    clearBlinkTimers();
    var prm = prefersReducedMotion();
    if (prm || !interactionsCfg || !shouldShowCaseyBehavior('rotate')) {
      avatars.forEach(function (img) {
        img.classList.toggle('casey-breathing', !prm && shouldShowCaseyBehavior('rotate'));
      });
      return;
    }
    var blinkRule = (interactionsCfg.interactions || []).filter(function (r) {
      return r.id === 'blink';
    })[0];
    if (!blinkRule) {
      avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
      return;
    }
    avatars.forEach(function (img) { img.classList.add('casey-breathing'); });
    function restPose() {
      if (getRestPose) return getRestPose();
      return 'idle';
    }
    function run() {
      var min = blinkRule.intervalMsMin || 4000;
      var max = blinkRule.intervalMsMax || 8000;
      var delay = min + Math.random() * (max - min);
      activeTimers.blink = setTimeout(function () {
        var tier = getTier();
        var after = restPose();
        if (!after) {
          run();
          return;
        }
        avatars.forEach(function (img) { img.classList.remove('casey-breathing'); });
        setManyPoses(avatars, assetBase, ext, tier, 'blink', { preload: false });
        activeTimers.blinkEnd = setTimeout(function () {
          setManyPoses(avatars, assetBase, ext, tier, after, { preload: false });
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
      ? (chapterActions[0][tone] || chapterActions[0].junior || []).slice()
      : [];

    if (chapter === 'concept') {
      var hasDemoChip = chips.some(function (c) {
        return c && c.target && String(c.target).indexOf('demo') !== -1;
      });
      if (!hasDemoChip && document.querySelector('[data-chapter="demo"]')) {
        chips.push({ label: 'Try the demo', target: '[data-chapter=demo]' });
      }
    }

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
              if (String(chip.target).indexOf('demo') !== -1) {
                setManyPoses(
                  document.querySelectorAll('[data-casey-avatar]'),
                  document.documentElement.dataset.assetBase || '/cases/assets/casey/',
                  'png',
                  readTier(),
                  'point',
                  { preload: false }
                );
              }
              target.scrollIntoView({
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                block: 'center',
              });
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

  // Raw {junior, mid, staff} object for a chapter's hint (hints take
  // priority over anecdotes, matching getHint()'s own lookup order) — used
  // by getHint() for the single active-tone string, and by the "explain
  // differently" cycle to read the OTHER tones' phrasings of the same hint.
  function getHintEntry(caseyData, chapter) {
    if (!caseyData) return null;
    var hints = caseyData.hints || [];
    var i;
    for (i = 0; i < hints.length; i++) {
      if (hints[i].chapter === chapter) return hints[i];
    }
    var anecdotes = caseyData.anecdotes || [];
    for (i = 0; i < anecdotes.length; i++) {
      if (anecdotes[i].chapter === chapter) return anecdotes[i];
    }
    return null;
  }

  function getHint(caseyData, chapter, tone) {
    var entry = getHintEntry(caseyData, chapter);
    if (!entry) return null;
    return entry[tone] || entry.junior || null;
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

  function flashConfetti(root, slug) {
    if (!shouldShowCaseyBehavior('confetti') || !root) return;
    var state = loadState();
    if (slug && state.confettiSeenSlugs.indexOf(slug) !== -1) return;
    if (slug) {
      state.confettiSeenSlugs.push(slug);
      saveState(state);
    }
    root.classList.add('casey-milestone-flash');
    setTimeout(function () { root.classList.remove('casey-milestone-flash'); }, 700);
  }

  function readLiveIndex() {
    var el = document.getElementById('case-live-index');
    if (!el) return [];
    try {
      return JSON.parse(el.textContent) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * "Casey recommends" pick shown on case completion: prefer a real,
   * human-curated relatedCases entry (front-matter field, populated per
   * case as content gets that pass) — falls back to the nearest unread
   * case in the same track, since relatedCases is empty on most cases
   * today. Returns { slug, title } or null if nothing suitable exists.
   */
  function pickRecommendation(caseyData, currentSlug, currentTrack, completedSlugs) {
    var live = readLiveIndex();
    var completed = {};
    (completedSlugs || []).forEach(function (s) { completed[s] = true; });
    var related = (caseyData && caseyData.relatedCases) || [];
    for (var i = 0; i < related.length; i++) {
      var match = live.filter(function (c) { return c.slug === related[i] && !completed[c.slug]; })[0];
      if (match) return { slug: match.slug, title: match.title };
    }
    var sameTrack = live.filter(function (c) {
      return c.track === currentTrack && c.slug !== currentSlug && !completed[c.slug];
    });
    if (!sameTrack.length) return null;
    return { slug: sameTrack[0].slug, title: sameTrack[0].title };
  }

  function readManifestSlugOrder() {
    var el = document.getElementById('manifest-slug-order');
    if (!el) return [];
    try {
      return JSON.parse(el.textContent) || [];
    } catch (e) {
      return [];
    }
  }

  function readCaseTitles() {
    var el = document.getElementById('hub-case-titles');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent) || {};
    } catch (e) {
      return {};
    }
  }

  function burstHubSparkles(hubRoot) {
    if (!hubRoot) return;
    var el = hubRoot.querySelector('[data-casey-hub-sparkles]');
    if (!el || !shouldShowCaseyBehavior('rotate')) return;
    el.classList.remove('is-active');
    void el.offsetWidth;
    el.classList.add('is-active');
    setTimeout(function () {
      el.classList.remove('is-active');
    }, 1200);
  }

  function hubAvatarWiggle(wrap) {
    if (!wrap || !shouldShowCaseyBehavior('rotate')) return;
    wrap.classList.remove('casey-wiggle');
    void wrap.offsetWidth;
    wrap.classList.add('casey-wiggle');
    setTimeout(function () {
      wrap.classList.remove('casey-wiggle');
    }, 480);
  }

  /* ── Surface: case coach ── */
  function initCase(opts) {
    var caseyData = opts.caseyData;
    if (!caseyData) return null;

    var html = document.documentElement;
    var prm = prefersReducedMotion();
    var assetBase = html.dataset.assetBase || '/cases/assets/casey/';
    var assetExt = 'png';
    var pathPrefix = html.dataset.pathPrefix || '/cases/';

    var currentTone = readTier();
    var currentChapter = null;
    var overridePoseUntil = 0;
    var takeawayTimer = null;
    var demoIdleTimer = null;
    var slug = caseyData.slug || (window.location.pathname.split('/').filter(Boolean).pop());
    var coachEntered = false;

    var cards = document.querySelectorAll('.casey-coach__card');
    var bubbles = document.querySelectorAll('.casey-coach__bubble');
    var avatars = document.querySelectorAll('[data-casey-avatar]');
    var actionContainers = document.querySelectorAll('.casey-coach__actions');
    var explainBtns = document.querySelectorAll('.casey-coach__explain');
    var explainCycle = null; // { chapter, tones: [...], idx } — reset on chapter change
    var dock = document.getElementById('casey-dock');
    var scrollRoot = document.querySelector('.case-scroll');
    var coachAsides = document.querySelectorAll('.casey-coach:not(.casey-coach--dock-bottom)');
    var intensityOff = getIntensity() === 'off';
    var focusPoseTimer = null;

    avatars.forEach(ensureAvatarFrame);

    recordEvent('case-started', { slug: slug });

    function setBubble(text, animate) {
      if (!shouldShowCaseyBehavior('bubble')) {
        bubbles.forEach(function (b) { b.textContent = ''; });
        return;
      }
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

    // "Explain differently": cycles through the OTHER reading-level
    // phrasings of the current chapter's hint, without touching the
    // reader's actual tone setting for the rest of the page — the three
    // tones are already independently-written text (see
    // CASE-AUTHORING-GUIDE.md), this just surfaces the other two on
    // request instead of only ever showing the active tone's version.
    var TONE_CYCLE_ORDER = ['junior', 'mid', 'staff'];
    function cycleExplainDifferently() {
      var entry = getHintEntry(caseyData, currentChapter);
      if (!entry) return;
      if (!explainCycle || explainCycle.chapter !== currentChapter) {
        var others = TONE_CYCLE_ORDER.filter(function (t) { return t !== currentTone && entry[t]; });
        explainCycle = { chapter: currentChapter, tones: others.concat([currentTone]), idx: -1 };
      }
      explainCycle.idx = (explainCycle.idx + 1) % explainCycle.tones.length;
      var tone = explainCycle.tones[explainCycle.idx];
      var text = entry[tone];
      if (!text) return;
      setBubble(text, true);
      var backToOriginal = tone === currentTone;
      explainBtns.forEach(function (btn) {
        btn.classList.toggle('casey-coach__explain--active', !backToOriginal);
        btn.setAttribute(
          'aria-label',
          backToOriginal ? 'Explain differently' : 'Explained at the ' + tone + ' level — tap to cycle'
        );
      });
    }
    explainBtns.forEach(function (btn) {
      btn.addEventListener('click', cycleExplainDifferently);
    });

    function setPose(pose, opts) {
      opts = opts || {};
      if (Date.now() < overridePoseUntil && !opts.force) return;
      if (!coachEntered && !prm) {
        opts = Object.assign({}, opts, { enter: true });
        coachEntered = true;
      }
      setManyPoses(avatars, assetBase, assetExt, currentTone, pose, opts);
      cards.forEach(function (card) {
        card.dataset.caseyTier = currentTone;
        card.dataset.caseyState = resolvePose(pose);
      });
    }

    function restartCoachMotion() {
      clearBlinkTimers();
      avatars.forEach(function (img) { img.classList.remove('casey-breathing'); });
      if (intensityOff || prm) {
        setPose('sleep', { force: true, crossfade: false });
        return;
      }
      loadInteractions(assetBase).then(function (cfg) {
        applyMotionTokens(cfg, currentTone, cards);
        scheduleBlink(
          avatars,
          assetBase,
          assetExt,
          function () { return currentTone; },
          cards,
          function () {
            if (!currentChapter) return prm ? 'sleep' : 'idle';
            var hint = getHint(caseyData, currentChapter, currentTone);
            return chapterPose(currentChapter, !!hint, prm);
          }
        );
      });
      if (currentChapter) {
        var hint = getHint(caseyData, currentChapter, currentTone);
        setPose(chapterPose(currentChapter, !!hint, prm), { force: true });
      } else {
        setPose('idle', { force: true });
      }
    }

    onPrefersReducedMotionChange(function () {
      prm = prefersReducedMotion();
      restartCoachMotion();
    });

    function applyTierLabels(cfg) {
      if (!cfg || !cfg.tierLabels) return;
      var label = cfg.tierLabels[currentTone];
      if (!label) return;
      document.querySelectorAll('.casey-coach__name, [data-casey-tier-label]').forEach(function (el) {
        el.textContent = label;
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

      explainCycle = null;
      var entryForExplain = getHintEntry(caseyData, chapterId);
      var distinctTones = entryForExplain
        ? TONE_CYCLE_ORDER.filter(function (t) { return entryForExplain[t]; }).length
        : 0;
      explainBtns.forEach(function (btn) {
        btn.hidden = distinctTones < 2;
        btn.classList.remove('casey-coach__explain--active');
        btn.setAttribute('aria-label', 'Explain differently');
      });

      if (shouldShowCaseyBehavior('chips')) {
        renderActionChips(caseyData, chapterId, currentTone, actionContainers);
      } else {
        actionContainers.forEach(function (c) { c.hidden = true; });
      }

      var chapters = document.querySelectorAll('.case-chapter[data-chapter]');
      var chIdx = 0;
      chapters.forEach(function (ch, i) {
        if (ch.dataset.chapter === chapterId) chIdx = i;
      });
      var pct = chapters.length > 1 ? chIdx / (chapters.length - 1) : 0;
      recordProgress(slug, chapterId, pct);

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
          var st = loadState();
          var firstGlobal = st.casesCompleted.length === 1;
          if (firstGlobal) {
            var mLine = lineAt('milestones.firstCaseCompleted', currentTone);
            if (mLine) setBubble(mLine, true);
          }
          flashConfetti(document.querySelector('.casebook-case'), slug);
          document.dispatchEvent(new CustomEvent('case-case-completed', { detail: { slug: slug } }));
          var state = loadState();
          // Fire each count milestone's own celebration only on the exact
          // crossing (===, not >=) so a reader who already passed five
          // cases doesn't get the five-cases line replayed on every
          // future completion — state.milestones already guards re-firing
          // across sessions, this guards re-firing within the same batch
          // of COUNT_MILESTONES on one completion.
          COUNT_MILESTONES.forEach(function (m) {
            if (state.casesCompleted.length !== m.count) return;
            setPose('celebrate', { force: true });
            avatars.forEach(function (img) { img.classList.add('casey-bounce-once'); });
            var mLine = lineAt(m.linePath, currentTone);
            if (mLine) setBubble(mLine, true);
            flashConfetti(document.querySelector('.casebook-case'), null);
          });
          if (shouldShowCaseyBehavior('chips')) {
            var liveIdx = readLiveIndex();
            var selfEntry = liveIdx.filter(function (c) { return c.slug === slug; })[0];
            var rec = pickRecommendation(caseyData, slug, selfEntry && selfEntry.track, state.casesCompleted);
            if (rec) {
              actionContainers.forEach(function (container) {
                var a = document.createElement('a');
                a.href = pathPrefix + rec.slug + '/';
                a.className = 'casey-coach__chip casey-coach__chip--recommend';
                a.textContent = 'Casey recommends: ' + (rec.title.length > 28 ? rec.title.slice(0, 26) + '…' : rec.title);
                container.appendChild(a);
                container.hidden = false;
              });
            }
          }
        }, 2000);
      }
    }

    var coachPeekTimer = null;
    function startCoachPeek() {
      if (coachPeekTimer) clearInterval(coachPeekTimer);
      if (prm || intensityOff || !shouldShowCaseyBehavior('rotate')) return;
      coachPeekTimer = setInterval(function () {
        if (document.hidden || currentChapter === 'takeaway') return;
        cards.forEach(function (card) {
          card.classList.add('casey-coach--peek');
          setTimeout(function () {
            card.classList.remove('casey-coach--peek');
          }, 520);
        });
        if (Math.random() < 0.35) {
          setPose('nod', { force: true, preload: false });
          setTimeout(function () {
            if (!currentChapter) return;
            var hint = getHint(caseyData, currentChapter, currentTone);
            setPose(chapterPose(currentChapter, !!hint, prm), { force: true, preload: false });
          }, 520);
        }
      }, 48000 + Math.random() * 12000);
    }
    startCoachPeek();

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
      cards.forEach(function (card) { card.dataset.caseyTier = newTone; });
      var hint = currentChapter ? getHint(caseyData, currentChapter, newTone) : null;
      var restorePose = currentChapter
        ? chapterPose(currentChapter, !!hint, prm)
        : (prm ? 'sleep' : 'idle');
      var tipKey = 'tone-switch-discover';
      var st = loadState();
      var firstToneSwitch = st.dismissedTips.indexOf(tipKey) === -1;
      if (firstToneSwitch && !prm) {
        setPose('perk', { tierFade: true, force: true });
        var discoverLine = lineAt('case.toneSwitchDiscover', newTone) || lineAt('case.toneSwitch', newTone);
        setBubble(discoverLine || hint || '', true);
        st.dismissedTips.push(tipKey);
        saveState(st);
        setTimeout(function () {
          setPose(restorePose, { force: true });
          if (hint) setBubble(hint, true);
        }, 1600);
      } else {
        setPose(restorePose, { tierFade: true, force: true });
        var toneLine = lineAt('case.toneSwitch', newTone);
        setBubble(hint || toneLine || voiceLineForChapter(caseyData, currentChapter || 'hook', newTone) || '');
      }
      if (currentChapter) renderActionChips(caseyData, currentChapter, newTone, actionContainers);
      if (interactionsCfg) applyMotionTokens(interactionsCfg, newTone, cards);
      if (interactionsCfg) applyTierLabels(interactionsCfg);
      ['idle', 'blink', 'nod', 'sleep', 'perk', restorePose].forEach(function (p) {
        if (p) preloadPose(assetBase, assetExt, newTone, p);
      });
    });

    document.addEventListener('casebook-color-change', function () {
      setPose(prm ? 'sleep' : (currentChapter === 'demo' ? 'point' : 'idle'), { force: true });
    });

    function bindDemoFocus() {
      var demoRoot = document.querySelector('[data-chapter="demo"]');
      if (!demoRoot || prm || intensityOff) return;
      var focusTargets = demoRoot.querySelectorAll(
        '.case-demo__btn, .case-demo__interactive, .case-demo__controls button, a.case-demo__btn'
      );
      focusTargets.forEach(function (el) {
        function toFocus() {
          if (Date.now() < overridePoseUntil) return;
          clearTimeout(focusPoseTimer);
          setPose('focus');
        }
        function fromFocus() {
          clearTimeout(focusPoseTimer);
          focusPoseTimer = setTimeout(function () {
            if (currentChapter === 'demo') setPose('point');
            else setPose('idle');
          }, 200);
        }
        el.addEventListener('mouseenter', toFocus);
        el.addEventListener('focusin', toFocus);
        el.addEventListener('mouseleave', fromFocus);
        el.addEventListener('focusout', fromFocus);
      });
    }

    function updateCoachCompact() {
      if (!shouldShowCaseyBehavior('bubble') || !scrollRoot) return;
      var compact = scrollRoot.scrollTop > 120;
      if (dock) dock.classList.toggle('casey-coach--compact', compact);
      coachAsides.forEach(function (el) {
        el.classList.toggle('casey-coach--compact', compact);
      });
    }

    if (scrollRoot) {
      scrollRoot.addEventListener('scroll', updateCoachCompact, { passive: true });
      updateCoachCompact();
    }

    if (intensityOff) {
      if (dock) {
        dock.classList.add('casey-coach--minimal');
        dock.hidden = false;
      }
      setPose('sleep');
      setBubble('');
      actionContainers.forEach(function (c) { c.hidden = true; });
    } else {
      if (dock) dock.hidden = false;
      setPose(prm ? 'sleep' : 'idle');
      var initLine = voiceLineForChapter(caseyData, 'hook', currentTone);
      if (initLine) setBubble(initLine);
    }

    bindDemoFocus();

    loadInteractions(assetBase).then(function (cfg) {
      applyTierLabels(cfg);
      applyMotionTokens(cfg, currentTone, cards);
      scheduleBlink(
        avatars,
        assetBase,
        assetExt,
        function () { return currentTone; },
        cards,
        function () {
          if (!currentChapter) return prm ? 'sleep' : 'idle';
          var hint = getHint(caseyData, currentChapter, currentTone);
          return chapterPose(currentChapter, !!hint, prm);
        }
      );
    });

    return { setPose: setPose, getChapter: function () { return currentChapter; } };
  }

  /* ── Surface: hub ── */
  function initHub(opts) {
    var hubEl = document.querySelector('[data-casey-hub]');
    if (!hubEl) return null;

    var hubData = opts.hubData || {};
    var prm = prefersReducedMotion();
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
      var titles = readCaseTitles();
      var last = state.lastSlug;
      if (
        last &&
        state.casesCompleted.indexOf(last) === -1 &&
        titles[last]
      ) {
        return lineAt('hub.lastCase', tier, { title: titles[last] }) || pickInitialGreetingFallback(tier);
      }
      return pickInitialGreetingFallback(tier);
    }

    function pickInitialGreetingFallback(tier) {
      var titles = readCaseTitles();
      var reviewSlug = pickReviewDueSlug(state.caseProgress, titles);
      if (reviewSlug) {
        var reviewLine = lineAt('hub.reviewDue', tier, { title: titles[reviewSlug] });
        if (reviewLine) return reviewLine;
      }
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

    function readHubCases() {
      var el = document.getElementById('hub-live-cases');
      if (!el) return [];
      try {
        var d = JSON.parse(el.textContent);
        return d.cases || [];
      } catch (e) {
        return [];
      }
    }

    function suggestNextInTrack() {
      var hubCases = readHubCases();
      var last = state.lastSlug;
      if (!last || !hubCases.length) return null;
      var order = readManifestSlugOrder();
      var sorted = hubCases.slice();
      if (order.length) {
        sorted.sort(function (a, b) {
          return order.indexOf(a.slug) - order.indexOf(b.slug);
        });
      }
      var current = null;
      for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].slug === last) {
          current = sorted[i];
          break;
        }
      }
      if (!current) return null;
      var inTrack = sorted.filter(function (c) { return c.track === current.track; });
      var idx = -1;
      for (var j = 0; j < inTrack.length; j++) {
        if (inTrack[j].slug === last) {
          idx = j;
          break;
        }
      }
      if (idx === -1 || idx >= inTrack.length - 1) return null;
      var pick = inTrack[idx + 1];
      return { slug: pick.slug, title: pick.title };
    }

    function pickUnreadSuggestion() {
      var titles = readCaseTitles();
      var completed = {};
      state.casesCompleted.forEach(function (s) { completed[s] = true; });
      if (state.lastSlug && !completed[state.lastSlug]) {
        return {
          slug: state.lastSlug,
          title: titles[state.lastSlug] || state.lastSlug,
          kind: 'continue',
        };
      }
      var nextTrack = suggestNextInTrack();
      if (nextTrack) {
        return { slug: nextTrack.slug, title: nextTrack.title, kind: 'next' };
      }
      var hubCases = readHubCases();
      for (var i = 0; i < hubCases.length; i++) {
        if (!completed[hubCases[i].slug]) {
          return {
            slug: hubCases[i].slug,
            title: hubCases[i].title || titles[hubCases[i].slug] || hubCases[i].slug,
            kind: 'unread',
          };
        }
      }
      if (flagshipSlug && !completed[flagshipSlug]) {
        return {
          slug: flagshipSlug,
          title: titles[flagshipSlug] || flagshipSlug,
          kind: 'flagship',
        };
      }
      return null;
    }

    function renderHubActions() {
      if (!actionsEl) return;
      actionsEl.innerHTML = '';
      var items = [];
      var continueSlug = state.lastSlug;
      if (continueSlug && state.casesCompleted.indexOf(continueSlug) === -1) {
        var prog = state.caseProgress[continueSlug];
        var pctLabel = '';
        if (prog && typeof prog.pct === 'number') {
          pctLabel = ' · ' + Math.round(prog.pct * 100) + '%';
        }
        items.push({
          href: pathPrefix + continueSlug + '/',
          label: 'Continue last case' + pctLabel,
          primary: true,
        });
      } else if (flagshipSlug) {
        items.push({
          href: pathPrefix + flagshipSlug + '/',
          label: 'Start flagship case',
          primary: true,
        });
      }
      var dueSlugs = dueForReview(state.caseProgress);
      if (dueSlugs.length) {
        items.push({
          href: pathPrefix + 'review/',
          label: 'Review ' + dueSlugs.length + ' due case' + (dueSlugs.length === 1 ? '' : 's'),
        });
      }
      var nextTrack = suggestNextInTrack();
      if (nextTrack) {
        items.push({
          href: pathPrefix + nextTrack.slug + '/',
          label: 'Next in track: ' + (nextTrack.title.length > 28 ? nextTrack.title.slice(0, 26) + '…' : nextTrack.title),
        });
      }

      // Static CTAs from casey-hub.json when present (library / about / subscribe)
      var dataActions = (hubData.actions || []).filter(function (a) {
        if (a.when === 'newsletter-enabled' && !document.getElementById('subscribe')) return false;
        if (a.useFlagshipSlug) return false; // already handled above
        return a.href || a.id === 'library' || a.id === 'about';
      });
      if (dataActions.length) {
        dataActions.forEach(function (a) {
          var href = a.href || '';
          if (href.indexOf('/cases/') === 0) href = href.replace(/^\/cases\//, pathPrefix);
          else if (href.charAt(0) === '/' && pathPrefix !== '/') {
            /* keep root-relative as-is for #subscribe etc. */
          }
          if (!href && a.id === 'library') href = pathPrefix + 'library/';
          if (!href && a.id === 'about') href = pathPrefix + 'about/';
          if (!href) return;
          items.push({ href: href, label: a.label });
        });
      } else {
        items.push({ href: pathPrefix + 'library/', label: 'Reading library' });
        items.push({ href: pathPrefix + 'about/', label: 'How this works' });
      }

      items.slice(0, 3).forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = item.href;
        a.className = 'casey-hub__action' + (item.primary ? ' casey-hub__action--primary' : '');
        a.textContent = item.label;
        if (item.primary) a.classList.add('case-continue__btn--pulse');
        a.addEventListener('click', function () {
          if (!prm && avatar) {
            setImgPose(avatar, assetBase, assetExt, currentTier, 'nod', { preload: false });
            setTimeout(function () {
              setImgPose(avatar, assetBase, assetExt, currentTier, 'present', { preload: false });
            }, 380);
          }
        });
        li.appendChild(a);
        actionsEl.appendChild(li);
      });
    }

    var visited;
    try { visited = !!localStorage.getItem(VISITED_KEY); } catch (e) { visited = false; }
    if (avatar) ensureAvatarFrame(avatar);
    var hubFrame = avatar && avatar.closest('.casey-avatar-frame');
    var hubPlayEl = hubEl.querySelector('[data-casey-hub-play]');
    var hubIdleTimer = null;
    var hubActionHoverTimer = null;

    function safeHubPose(pose) {
      // wave / welcome / perk are first-class hub poses (do not collapse to present)
      return pose || 'present';
    }

    function hubBasePose() {
      if (getIntensity() === 'off') return 'sleep';
      if (prm) return 'sleep';
      return 'present';
    }

    function hubSettlePose() {
      return hubBasePose();
    }

    function hubMotionAllowed() {
      return !prm && shouldShowCaseyBehavior('rotate');
    }

    function setHubBreathing(on) {
      if (!hubFrame) return;
      hubFrame.classList.toggle('casey-breathing', !!on);
    }

    function stopHubIdleLoop() {
      if (hubIdleTimer) clearTimeout(hubIdleTimer);
      hubIdleTimer = null;
    }

    function startHubIdleLoop() {
      stopHubIdleLoop();
      if (!hubMotionAllowed() || !avatar || filterActive) return;
      setHubBreathing(true);
      function tick() {
        if (!hubMotionAllowed() || filterActive || document.hidden) {
          hubIdleTimer = setTimeout(tick, 2500);
          return;
        }
        var roll = Math.random();
        var pose = null;
        var hold = 380;
        if (roll < 0.42) pose = 'blink';
        else if (roll < 0.58) pose = 'nod';
        else if (roll < 0.70) { pose = 'wave'; hold = 720; }
        else if (roll < 0.82) { pose = 'perk'; hold = 650; }
        else if (roll < 0.90) { pose = 'think'; hold = 700; }
        if (!pose) {
          hubIdleTimer = setTimeout(tick, 5000 + Math.random() * 4000);
          return;
        }
        setHubBreathing(false);
        setImgPose(avatar, assetBase, assetExt, currentTier, pose, {});
        if (pose === 'nod' && Math.random() < 0.35) burstHubSparkles(hubEl);
        hubIdleTimer = setTimeout(function () {
          setImgPose(avatar, assetBase, assetExt, currentTier, hubSettlePose(), {});
          setHubBreathing(true);
          hubIdleTimer = setTimeout(tick, 4500 + Math.random() * 5500);
        }, hold);
      }
      hubIdleTimer = setTimeout(tick, 3500 + Math.random() * 2000);
    }

    function enableHubFloat() {
      if (!hubPlayEl || !hubMotionAllowed()) return;
      hubPlayEl.classList.add('casey-hub__avatar-wrap--float');
    }

    function playHubEntrance() {
      hubEl.classList.add('casey-hub--enter');
      requestAnimationFrame(function () {
        hubEl.classList.add('casey-hub--entered');
      });
      if (!avatar) return;
      var alt = 'Casey, ' + currentTier + ' developer kitten';
      if (prm || getIntensity() === 'off') {
        setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), { alt: alt, enter: true });
        return;
      }
      if (!visited) {
        setImgPose(avatar, assetBase, assetExt, currentTier, 'wave', { alt: alt, enter: true });
        setTimeout(function () {
          setImgPose(avatar, assetBase, assetExt, currentTier, 'nod', {});
          setTimeout(function () {
            setImgPose(avatar, assetBase, assetExt, currentTier, hubSettlePose(), {});
            startHubIdleLoop();
            enableHubFloat();
          }, 650);
        }, 520);
      } else {
        setImgPose(avatar, assetBase, assetExt, currentTier, 'welcome', { alt: alt, enter: true });
        setTimeout(function () {
          setImgPose(avatar, assetBase, assetExt, currentTier, hubSettlePose(), {});
          startHubIdleLoop();
          enableHubFloat();
        }, 900);
      }
    }

    function preloadHubBundle(done) {
      var poses = ['present', 'blink', 'nod', 'wave', 'welcome', 'perk', 'think', hubBasePose(), 'sleep'];
      var seen = {};
      var list = poses.filter(function (p) {
        if (!p || seen[p]) return false;
        seen[p] = true;
        return true;
      });
      if (!list.length) {
        done();
        return;
      }
      var pending = list.length;
      list.forEach(function (p) {
        var probe = new Image();
        function finish() {
          pending -= 1;
          if (pending <= 0) done();
        }
        probe.onload = finish;
        probe.onerror = finish;
        probe.src = avatarSrc(assetBase, assetExt, currentTier, p);
      });
    }

    function bindHubPlay() {
      if (!hubPlayEl || !avatar) return;

      function waveAtCasey() {
        if (filterActive || prm || getIntensity() === 'off') return;
        stopHubIdleLoop();
        setHubBreathing(false);
        burstHubSparkles(hubEl);
        hubAvatarWiggle(hubPlayEl);
        var next = pickUnreadSuggestion();
        if (next && shouldShowCaseyBehavior('bubble')) {
          setImgPose(avatar, assetBase, assetExt, currentTier, 'point', { preload: false });
          var suggestLine = lineAt('hub.clickSuggest', currentTier, { title: next.title });
          setGreetingText(
            suggestLine ||
              ('Try “' + next.title + '” next — tap the button below when you’re ready.')
          );
          // Pulse the primary CTA when we recommended something concrete
          if (actionsEl) {
            var primary = actionsEl.querySelector('.casey-hub__action--primary');
            if (primary) {
              primary.classList.remove('case-continue__btn--pulse');
              void primary.offsetWidth;
              primary.classList.add('case-continue__btn--pulse');
            }
          }
        } else {
          setImgPose(avatar, assetBase, assetExt, currentTier, 'nod', { preload: false });
          var quip = lineAt('hub.clickHi', currentTier);
          if (quip && shouldShowCaseyBehavior('bubble')) setGreetingText(quip);
        }
        setTimeout(function () {
          setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), { preload: false });
          startHubIdleLoop();
        }, 900);
      }

      hubPlayEl.addEventListener('click', waveAtCasey);
      hubPlayEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          waveAtCasey();
        }
      });

      if (window.matchMedia('(pointer: fine)').matches && hubMotionAllowed()) {
        hubEl.addEventListener('mousemove', function (e) {
          if (!hubFrame || filterActive) return;
          var rect = hubEl.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          hubFrame.style.setProperty('--casey-look-x', (x * 10).toFixed(1) + 'px');
          hubFrame.style.setProperty('--casey-look-y', (y * -6).toFixed(1) + 'px');
        });
        hubEl.addEventListener('mouseleave', function () {
          if (!hubFrame) return;
          hubFrame.style.setProperty('--casey-look-x', '0px');
          hubFrame.style.setProperty('--casey-look-y', '0px');
        });
      }

      if (actionsEl) {
        actionsEl.addEventListener('mouseenter', function (e) {
          var link = e.target.closest('.casey-hub__action');
          if (!link || !hubMotionAllowed() || filterActive) return;
          if (hubActionHoverTimer) clearTimeout(hubActionHoverTimer);
          setHubBreathing(false);
          var pose = 'nod';
          setImgPose(avatar, assetBase, assetExt, currentTier, pose, { preload: false });
        }, true);
        actionsEl.addEventListener('mouseleave', function (e) {
          if (!e.target.closest('.casey-hub__action')) return;
          if (hubActionHoverTimer) clearTimeout(hubActionHoverTimer);
          hubActionHoverTimer = setTimeout(function () {
            setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), { preload: false });
            setHubBreathing(true);
          }, 220);
        }, true);
        actionsEl.addEventListener('focusin', function (e) {
          var link = e.target.closest('.casey-hub__action');
          if (!link || !hubMotionAllowed() || filterActive) return;
          setHubBreathing(false);
          setImgPose(avatar, assetBase, assetExt, currentTier, 'nod', { preload: false });
        });
        actionsEl.addEventListener('focusout', function () {
          hubActionHoverTimer = setTimeout(function () {
            setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), { preload: false });
            setHubBreathing(true);
          }, 200);
        });
      }
    }

    if (getIntensity() === 'off' && greetingEl) {
      greetingEl.textContent = '';
    }
    if (tierLabelEl && interactionsCfg && interactionsCfg.tierLabels) {
      tierLabelEl.textContent = interactionsCfg.tierLabels[currentTier];
    }
    // Visit greetings: CaseyGuide owns them when loaded (casey-hub.js).
    // Companion still owns click / filter / tone lines so they don't fight.
    if (!window.CaseyGuide) {
      setGreetingText(pickInitialGreeting(currentTier));
    }
    renderHubActions();
    ['present', 'blink', 'nod', hubBasePose()].forEach(function (p) {
      preloadPose(assetBase, assetExt, currentTier, p);
    });
    if (hubFrame) hubFrame.classList.add('casey-hub__avatar--loading');
    preloadHubBundle(function () {
      if (hubFrame) hubFrame.classList.remove('casey-hub__avatar--loading');
      playHubEntrance();
    });
    bindHubPlay();

    function rotateGreeting() {
      var g = greetings(currentTier);
      if (g.length < 2) return;
      greetingIdx = (greetingIdx + 1) % g.length;
      setGreetingText(g[greetingIdx]);
    }

    var filterActive = false;

    function startRotation() {
      if (prm || !shouldShowCaseyBehavior('rotate') || filterActive) return;
      if (rotateTimer) clearInterval(rotateTimer);
      rotateTimer = setInterval(function () {
        if (!document.hidden && !filterActive) rotateGreeting();
      }, 30000);
    }

    function stopRotation() {
      if (rotateTimer) clearInterval(rotateTimer);
      rotateTimer = null;
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
      if (hubFrame) hubFrame.dataset.caseyTier = newTier;
      stopHubIdleLoop();
      ['present', 'blink', 'nod', 'idle', 'sleep'].forEach(function (p) {
        preloadPose(assetBase, assetExt, newTier, p);
      });
      if (avatar) {
        setImgPose(avatar, assetBase, assetExt, newTier, hubBasePose(), { tierFade: true });
      }
      if (tierLabelEl && interactionsCfg && interactionsCfg.tierLabels) {
        tierLabelEl.textContent = interactionsCfg.tierLabels[newTier];
      }
      setGreetingText(lineAt('hub.toneSwitch', newTier) || pickInitialGreeting(newTier));
      hubEl.dataset.caseyTier = newTier;
      if (hubMotionAllowed()) startHubIdleLoop();
    });

    document.addEventListener('casey-companion-event', function (e) {
      if (!e.detail || e.detail.type !== 'casey-intensity-change') return;
      stopHubIdleLoop();
      setHubBreathing(false);
      if (hubPlayEl) hubPlayEl.classList.remove('casey-hub__avatar-wrap--float');
      if (avatar) {
        setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), { preload: false });
      }
      if (getIntensity() !== 'off' && hubMotionAllowed()) {
        startHubIdleLoop();
        enableHubFloat();
      }
      if (greetingEl) greetingEl.hidden = !shouldShowCaseyBehavior('bubble');
      if (actionsEl) actionsEl.hidden = !shouldShowCaseyBehavior('chips');
    });

    onPrefersReducedMotionChange(function () {
      prm = prefersReducedMotion();
      stopHubIdleLoop();
      setHubBreathing(false);
      if (hubPlayEl) hubPlayEl.classList.remove('casey-hub__avatar-wrap--float');
      stopRotation();
      if (avatar) {
        setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), {
          preload: false,
          crossfade: false,
        });
      }
      if (hubMotionAllowed()) {
        startHubIdleLoop();
        enableHubFloat();
        startRotation();
      }
    });

    document.addEventListener('casey-hub-filter', function (e) {
      var d = e.detail || {};
      filterActive = !!d.track;
      if (filterActive) {
        stopRotation();
        stopHubIdleLoop();
        setHubBreathing(false);
      } else {
        if (avatar) {
          setImgPose(avatar, assetBase, assetExt, currentTier, hubBasePose(), { preload: false });
        }
        startRotation();
        startHubIdleLoop();
      }
      var sug = suggest({
        surface: 'hub',
        tone: currentTier,
        filterCount: d.count,
        track: d.track,
      });
      if (shouldShowCaseyBehavior('bubble') && sug.line) setGreetingText(sug.line);
      if (avatar && sug.pose) {
        setImgPose(avatar, assetBase, assetExt, currentTier, safeHubPose(sug.pose), { preload: false });
      }
      var emptyImg = document.querySelector('#hub-grid-empty .hub-empty__img');
      if (emptyImg && d.track) {
        setImgPose(emptyImg, assetBase, assetExt, currentTier, d.count === 0 ? 'curious' : 'nod', {
          preload: false,
          alt: 'Casey — filter',
        });
      }
      var emptyMsg = document.querySelector('#hub-grid-empty .hub-empty__msg');
      if (emptyMsg && d.track && d.count === 0) {
        emptyMsg.textContent = lineAt('hub.filterEmpty', currentTier) || emptyMsg.textContent;
      }
    });

    loadInteractions(assetBase).then(function (cfg) {
      if (tierLabelEl && cfg && cfg.tierLabels) {
        tierLabelEl.textContent = cfg.tierLabels[currentTier];
      }
      if (hubFrame && cfg && cfg.tierMotion) {
        var motion = cfg.tierMotion[currentTier] || cfg.tierMotion.junior;
        hubFrame.style.setProperty('--casey-breathe-duration', motion.breatheDurationSec + 's');
      }
    });

    return { stopHubIdle: stopHubIdleLoop, startHubIdle: startHubIdleLoop };
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

    if (avatar) ensureAvatarFrame(avatar);
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

    document.addEventListener('casey-library-filter', function (e) {
      var d = e.detail || {};
      var tier = readTier();
      var line;
      if (typeof d.count === 'number' && d.count >= 0) {
        line = lineAt('library.filteredCount', tier, {
          n: d.count,
          nLabel: d.count === 1 ? '' : 's',
        });
      } else {
        line = lineAt('library.filtered', tier);
      }
      if (lineEl && line) lineEl.textContent = line;
      if (avatar && d.count === 0) {
        setImgPose(avatar, assetBase, assetExt, tier, 'curious', { preload: false });
      } else if (avatar && d.count > 0 && !prm) {
        avatar.classList.add('casey-library--bounce');
        setTimeout(function () {
          avatar.classList.remove('casey-library--bounce');
        }, 600);
      }
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

  document.addEventListener('casey-companion-event', function (e) {
    if (!e.detail || e.detail.type !== 'casey-intensity-change') return;
    var intensity = getIntensity();
    document.querySelectorAll('#casey-dock, .casey-coach').forEach(function (el) {
      if (intensity === 'off') el.classList.add('casey-coach--minimal');
      else el.classList.remove('casey-coach--minimal');
    });
    var hubGreeting = document.getElementById('casey-hub-greeting');
    if (hubGreeting) hubGreeting.hidden = !shouldShowCaseyBehavior('bubble');
    var hubActions = document.querySelector('.casey-hub__actions');
    if (hubActions) hubActions.hidden = !shouldShowCaseyBehavior('chips');

    var libAvatar = document.querySelector('[data-casey-library-avatar]');
    if (libAvatar) {
      var tier = readTier();
      var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
      var libPose = intensity === 'off' ? 'sleep' : 'read';
      setImgPose(libAvatar, assetBase, 'png', tier, libPose, { preload: false });
      if (intensity === 'off') libAvatar.classList.remove('casey-breathing');
    }
  });

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
    shouldShowCaseyBehavior: shouldShowCaseyBehavior,
    getIntensity: getIntensity,
    recordProgress: recordProgress,
    lineAt: lineAt,
    readTier: readTier,
    dueForReview: dueForReview,
    pickReviewDueSlug: pickReviewDueSlug,
  };
}());
