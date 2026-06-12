/* visuals.js — Layer L4: homepage orchestration
   Loads on: index.html only
   Exports: lazy-loads RecruiterBriefing, Eggs (per tier)
   Must not: mobile nav, theme persistence, contact POST, recruiter panel HTML
   Kill-switch: window.__VISUALS_DISABLED = true before this script loads */
(function () {
  'use strict';

  /* ── Capability detection ── */
  function mq(q) { return window.matchMedia(q).matches; }
  var conn = navigator.connection || {};
  var caps = {
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    finePointer:   mq('(pointer: fine)'),
    coarsePointer: mq('(pointer: coarse)'),
    saveData:      !!(conn.saveData || /^(2g|slow-2g)$/.test(conn.effectiveType)),
    canvas2d:      (function () { try { return !!document.createElement('canvas').getContext('2d'); } catch (e) { return false; } }()),
    iob:           'IntersectionObserver' in window
  };

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    if (window.__VISUALS_DISABLED) return;
    /* Core reveal & entrance */
    initScrollReveal();
    initHeroNameReveal();
    initSectionLabelTypewriter();
    /* Visual identity */
    initSectionRailSync();
    initTagColorCoding();
    /* Hero */
    if (caps.canvas2d && !caps.reducedMotion && !caps.saveData) initHeroCanvas();
    initHeroChrome();
    initHeroParallax();
    /* Stats & counters */
    initStatCountUp();
    initDynamicTenure();
    /* Cards & interactions */
    initCardExpand();
    initCardTilt();
    initMagneticCtas();
    initTagStagger();
    initArticleTap();
    initFaqSvgMorph();
    /* Content */
    initPipelineProgress();
    initCareerBar();
    initCasebookCount();
    /* Contact */
    initContactCounter();
    /* Scroll & spatial */
    initCursorSpotlight();
    initProgressRing();
    initKeyboardSectionNav();
    /* Eggs & recruiter */
    initEggs();
    initSkillsConstellationHint();
    initThemeWink();
    if (caps.iob) initTimelineHighlight();
    initImpactLens();
    initRecruiterMode();
    initRecruiterPrefill();
    initResumeToast();
    /* Mobile */
    initMobileFab();
    initHapticFeedback();
    initFactsDots();
    initMobileNavSwipe();
    /* System */
    if (!caps.reducedMotion) initThemeCrossfade();
    initHireShortcut();
    initPerfShortcut();
    initServiceWorker();
  }

  /* ══════════════════════════════════════════════════
     SCROLL REVEAL — .fade-up → .in
     ══════════════════════════════════════════════════ */
  function initScrollReveal() {
    var els = document.querySelectorAll('.fade-up');
    if (!els.length) return;
    if (caps.reducedMotion || !caps.iob) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () { entry.target.classList.add('in'); }, i * 80);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.07 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ══════════════════════════════════════════════════
     HERO CHROME — rotate, spotlight, card tilt, float parallax
     ══════════════════════════════════════════════════ */
  function initHeroChrome() {
    var rotateEl = document.querySelector('.hero-rotate');
    if (rotateEl && !caps.reducedMotion) {
      var rSpans = Array.from(rotateEl.querySelectorAll('span'));
      if (rSpans.length > 1) {
        var rIdx = 0;
        rSpans[rIdx].classList.add('active');
        setInterval(function () {
          rSpans[rIdx].classList.remove('active');
          rIdx = (rIdx + 1) % rSpans.length;
          rSpans[rIdx].classList.add('active');
        }, 2800);
      }
    }

    if (!caps.finePointer || caps.reducedMotion) return;

    var heroEl = document.getElementById('hero');
    var heroCard = document.querySelector('.hero-card');
    var heroFloats = Array.from(document.querySelectorAll('.hero-float'));
    if (!heroEl || !heroCard) return;

    var rafPending = false;
    var pendingMx = 5, pendingMy = 60;
    var heroReady = false;

    setTimeout(function () { heroReady = true; }, 1200);

    function applySpotlight() {
      heroEl.style.setProperty('--mx', pendingMx.toFixed(1) + '%');
      heroEl.style.setProperty('--my', pendingMy.toFixed(1) + '%');
      rafPending = false;
    }

    heroEl.addEventListener('mousemove', function (e) {
      var rect = heroEl.getBoundingClientRect();
      pendingMx = (e.clientX - rect.left) / rect.width * 100;
      pendingMy = (e.clientY - rect.top) / rect.height * 100;
      if (!rafPending) { rafPending = true; requestAnimationFrame(applySpotlight); }

      if (heroReady) {
        var cr = heroCard.getBoundingClientRect();
        var cx = ((e.clientX - cr.left) / cr.width - .5) * 14;
        var cy = ((e.clientY - cr.top) / cr.height - .5) * 10;
        heroCard.style.transform = 'perspective(900px) rotateY(' + cx.toFixed(2) + 'deg) rotateX(' + (-cy).toFixed(2) + 'deg) translateZ(8px)';
      }

      var dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      var dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      heroFloats.forEach(function (f) {
        var sz = parseInt(f.style.fontSize, 10) || 30;
        var spd = sz / 2800;
        f.style.transform = 'translate(' + (dx * spd * rect.width).toFixed(1) + 'px,' + (dy * spd * rect.height).toFixed(1) + 'px)';
      });
    });

    heroEl.addEventListener('mouseleave', function () {
      heroCard.style.transform = '';
      heroFloats.forEach(function (f) { f.style.transform = ''; });
      pendingMx = 5; pendingMy = 60;
      if (!rafPending) { rafPending = true; requestAnimationFrame(applySpotlight); }
    });
  }

  /* ══════════════════════════════════════════════════
     STAT COUNT-UP — .stat-n on scroll into view
     ══════════════════════════════════════════════════ */
  function initStatCountUp() {
    if (caps.reducedMotion || !caps.iob) return;
    var statEls = document.querySelectorAll('.stat-n');
    if (!statEls.length) return;
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        statObs.unobserve(el);
        var original = el.textContent.trim();
        var match = original.match(/^(\d+)(.*)/);
        if (!match) return;
        var endNum = parseInt(match[1], 10);
        var suffix = match[2];
        var dur = 900, startTs = null;
        function tick(ts) {
          if (!startTs) startTs = ts;
          var elapsed = Math.min(ts - startTs, dur);
          var ease = 1 - Math.pow(1 - elapsed / dur, 3);
          el.textContent = Math.round(ease * endNum) + suffix;
          if (elapsed < dur) requestAnimationFrame(tick);
          else el.textContent = original;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6, rootMargin: '0px 0px -40px 0px' });
    statEls.forEach(function (el) { statObs.observe(el); });
  }

  /* Service worker: registered from /assets/sw-migrate.js in <head> (portfolio + Casebook). */
  function initServiceWorker() { /* no-op — see sw-migrate.js */ }

  /* ══════════════════════════════════════════════════
     HERO CANVAS — 2D particle constellation
     ══════════════════════════════════════════════════ */
  function initHeroCanvas() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var W = hero.offsetWidth, H = hero.offsetHeight;
    var mobile = W < 640;
    var N      = mobile ? 50 : W < 1024 ? 85 : 140;
    var THRESH = mobile ? 88 : 125;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('focusable', 'false');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0;transition:opacity 1.4s ease;';
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;

    var px = new Float32Array(N), py = new Float32Array(N);
    var pz = new Float32Array(N);
    var vx = new Float32Array(N), vy = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      px[i] = Math.random() * W;
      py[i] = Math.random() * H;
      pz[i] = 0.4 + Math.random() * 0.6;
      vx[i] = (Math.random() - 0.5) * 0.2;
      vy[i] = (Math.random() - 0.5) * 0.13;
    }

    var mx = -999, my = -999;
    if (caps.finePointer) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
      });
      hero.addEventListener('mouseleave', function () { mx = -999; my = -999; });
    }

    var particleColors = { dotBase: '80,55,35,', lineBase: '100,75,50,' };

    function refreshParticleColors() {
      var cs = getComputedStyle(document.documentElement);
      var ink = (cs.getPropertyValue('--ink') || '#1C1714').trim();
      var accent = (cs.getPropertyValue('--accent') || '#BF5A32').trim();
      function hexToRgb(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        if (h.length !== 6) return null;
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16)
        };
      }
      var ir = hexToRgb(ink);
      var ar = hexToRgb(accent);
      if (ir) {
        particleColors.dotBase = ir.r + ',' + ir.g + ',' + ir.b + ',';
        particleColors.lineBase = ir.r + ',' + ir.g + ',' + ir.b + ',';
      }
      if (ar) {
        particleColors.lineBase = ar.r + ',' + ar.g + ',' + ar.b + ',';
      }
    }

    refreshParticleColors();
    document.addEventListener('themechange', refreshParticleColors);

    var running = true;
    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);

      var dotBase = particleColors.dotBase;
      var lineBase = particleColors.lineBase;

      for (var j = 0; j < N; j++) {
        px[j] += vx[j]; py[j] += vy[j];
        if (px[j] < 0 || px[j] > W) vx[j] *= -1;
        if (py[j] < 0 || py[j] > H) vy[j] *= -1;
        if (mx > 0) {
          var ddx = px[j] - mx, ddy = py[j] - my;
          var d2 = ddx * ddx + ddy * ddy;
          if (d2 < 7000 && d2 > 1) {
            var f = 0.28 / Math.sqrt(d2);
            vx[j] += ddx * f; vy[j] += ddy * f;
            var sp = Math.sqrt(vx[j]*vx[j]+vy[j]*vy[j]);
            if (sp > 0.9) { vx[j] = vx[j]/sp*0.9; vy[j] = vy[j]/sp*0.9; }
          }
        }
        ctx.beginPath();
        ctx.arc(px[j], py[j], pz[j] * (mobile ? 1.4 : 1.8), 0, 6.2832);
        ctx.fillStyle = 'rgba(' + dotBase + (pz[j] * 0.32).toFixed(2) + ')';
        ctx.fill();
      }

      for (var a = 0; a < N; a++) {
        for (var b = a + 1; b < N; b++) {
          var dx = px[a] - px[b], dy = py[a] - py[b];
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < THRESH) {
            var alpha = (1 - dist / THRESH) * 0.09;
            ctx.beginPath();
            ctx.moveTo(px[a], py[a]); ctx.lineTo(px[b], py[b]);
            ctx.strokeStyle = 'rgba(' + lineBase + alpha.toFixed(3) + ')';
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(function () { requestAnimationFrame(function () { canvas.style.opacity = '1'; }); });
    loop();

    if (caps.iob) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running) loop();
      }, { threshold: 0 }).observe(hero);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        W = hero.offsetWidth; H = hero.offsetHeight;
        canvas.width = W; canvas.height = H;
      }, 250);
    });
  }


  /* ══════════════════════════════════════════════════
     PROJECT CARD EXPAND — "Read more" for clamped descs
     ══════════════════════════════════════════════════ */
  function initCardExpand() {
    var descs = Array.from(document.querySelectorAll('.pc-desc'));
    /* Read all layout props in one pass before any DOM mutation (avoids forced reflow per item) */
    var clamped = descs.filter(function (d) { return d.scrollHeight > d.clientHeight + 2; });
    clamped.forEach(function (desc) {
      var btn = document.createElement('button');
      btn.className = 'pc-read-more';
      btn.textContent = 'Read more ↓';
      btn.setAttribute('aria-expanded', 'false');
      desc.parentNode.insertBefore(btn, desc.nextSibling);
      btn.addEventListener('click', function () {
        var expanded = desc.classList.toggle('expanded');
        btn.textContent = expanded ? 'Show less ↑' : 'Read more ↓';
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    });
  }

  /* ══════════════════════════════════════════════════
     CARD TILT — cursor-tracked 3-D perspective tilt
     Fine pointer + motion-OK only.
     ══════════════════════════════════════════════════ */
  function initCardTilt() {
    if (!caps.finePointer || caps.reducedMotion) return;
    document.querySelectorAll('.pc, .sv-card, .edu-card').forEach(function(card) {
      var lift = card.classList.contains('pc') ? -4 : -3;
      card.addEventListener('mouseenter', function() {
        card.style.transitionProperty = 'border-color, transform';
      });
      card.addEventListener('mousemove', function(e) {
        var r  = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width  - 0.5;
        var ny = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          'translateY(' + lift + 'px) perspective(700px) rotateX(' + (-ny * 6).toFixed(2) + 'deg) rotateY(' + (nx * 6).toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', function() {
        card.style.transitionProperty = '';
        card.style.transform = '';
      });
    });
  }

  /* ══════════════════════════════════════════════════
     ARTICLE FULL-CARD TAP — coarse pointer navigates
     whole row to the article link
     ══════════════════════════════════════════════════ */
  function initArticleTap() {
    if (caps.finePointer) return;
    document.querySelectorAll('.article-item').forEach(function(item) {
      var link = item.querySelector('h3.article-title a');
      if (!link) return;
      item.addEventListener('click', function(e) {
        if (e.target && e.target.closest && e.target.closest('a')) return;
        if (link.target === '_blank') {
          window.open(link.href, '_blank', 'noopener');
        } else {
          window.location.href = link.href;
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════
     TAG STAGGER — set --tag-i index for CSS animation
     ══════════════════════════════════════════════════ */
  function initTagStagger() {
    document.querySelectorAll('.pc').forEach(function(card) {
      card.querySelectorAll('.tag').forEach(function(tag, i) {
        tag.style.setProperty('--tag-i', i);
      });
    });
  }

  /* ══════════════════════════════════════════════════
     DEVICE TIER — matchMedia-based (no UA sniffing)
     ══════════════════════════════════════════════════ */
  function getDeviceTier() {
    var narrow = mq('(max-width: 639px)');
    var tablet = mq('(min-width: 640px) and (max-width: 1023px)');
    var wide   = mq('(min-width: 1024px)');
    var coarse = mq('(pointer: coarse)');
    var fine   = mq('(pointer: fine)');
    var hover  = mq('(hover: hover)');

    if (narrow || (coarse && !wide)) return 'mobile';
    if (tablet || (coarse && fine))  return 'tablet';
    if (wide && fine && hover)       return 'desktop';
    return 'mobile';
  }

  /* ── CSS lazy-loader ── */
  function loadCss(href) {
    return new Promise(function (resolve) {
      /* Already loaded? */
      if (document.querySelector('link[href="' + href + '"]')) { resolve(); return; }
      var link    = document.createElement('link');
      link.rel    = 'stylesheet';
      link.href   = href;
      link.onload  = resolve;
      link.onerror = resolve; /* fail-safe: still boot eggs */
      document.head.appendChild(link);
    });
  }

  /* ══════════════════════════════════════════════════
     EGG LOADER — lazy per-tier chunk
     ══════════════════════════════════════════════════ */
  function initEggs() {
    if (window.__VISUALS_DISABLED) return;
    var tier   = getDeviceTier();
    var files  = { mobile: '/assets/eggs-mobile.js', tablet: '/assets/eggs-tablet.js', desktop: '/assets/eggs-desktop.js' };
    var jsFile = files[tier];
    if (!jsFile) return;

    loadCss('/assets/eggs.css')
      .then(function () { return loadScript('/assets/eggs-data.js'); })
      .then(function () { return loadScript(jsFile); })
      .then(function () {
        if (window.Eggs && window.Eggs.boot) window.Eggs.boot(tier, caps);
      })
      .catch(function () { /* eggs degraded silently */ });
  }

  function initSkillsConstellationHint() {
    var hint = document.querySelector('.skills-constellation-hint');
    if (!hint || caps.reducedMotion) return;
    if (!mq('(min-width: 820px)')) return;
    hint.removeAttribute('hidden');
  }

  /* ══════════════════════════════════════════════════
     THEME WINK (X2) — 5 rapid toggles → one-line toast
     Cross-tier; once per session.
     ══════════════════════════════════════════════════ */
  function initThemeWink() {
    var btn = document.getElementById('theme-pick-btn-header') ||
      document.getElementById('theme-pick-btn-mobile');
    if (!btn) return;

    var winks   = (window.__EGG_DATA && window.__EGG_DATA.themeWinks) || [
      'System: please pick a lane.',
      'Dark · Light · Dark · Light · …ok.',
      'Both look great - commit to one?',
      'Achievement unlocked: indecisive.'
    ];
    var winkIdx = 0;
    var winkFired = false;
    try { winkFired = sessionStorage.getItem('egg_theme_wink') === '1'; } catch (e) {}
    if (winkFired) return;

    var clicks = 0, resetTimer;

    btn.addEventListener('click', function () {
      clicks++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { clicks = 0; }, 3000);

      if (clicks >= 5) {
        clicks = 0;
        clearTimeout(resetTimer);
        try { sessionStorage.setItem('egg_theme_wink', '1'); } catch (e) {}

        var toast = document.getElementById('copyToast');
        if (toast) {
          toast.textContent = winks[winkIdx % winks.length];
          winkIdx++;
          toast.classList.add('show');
          setTimeout(function () { toast.classList.remove('show'); }, 2800);
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════
     TIMELINE SCROLL-SYNC — highlight active employer
     D27: also draws the connector line on first scroll
     ══════════════════════════════════════════════════ */
  function initTimelineHighlight() {
    var items = document.querySelectorAll('.t-item');
    if (!items.length) return;

    /* D27 — Draw connector line when timeline section enters viewport */
    var timelineEl = document.querySelector('.timeline');
    if (timelineEl && !caps.reducedMotion) {
      new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          timelineEl.classList.add('tl-line-drawn');
        }
      }, { threshold: 0.08 }).observe(timelineEl);
    } else if (timelineEl) {
      timelineEl.classList.add('tl-line-drawn');
    }

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          items.forEach(function(el) { el.classList.remove('tl-active'); });
          entry.target.classList.add('tl-active');
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -30% 0px' });

    items.forEach(function(item) { io.observe(item); });
  }

  /* ══════════════════════════════════════════════════
     PROJECT IMPACT LENS — bar chart reveal on hover/tap
     ══════════════════════════════════════════════════ */
  function initImpactLens() {
    document.querySelectorAll('.pc[data-impact]').forEach(function(card) {
      var raw = card.getAttribute('data-impact');
      var metrics;
      try { metrics = JSON.parse(raw); } catch(e) { return; }
      if (!metrics || !metrics.length) return;

      var lens = document.createElement('div');
      lens.className = 'pc-lens';
      lens.setAttribute('aria-hidden', 'true');
      lens.innerHTML = metrics.map(function(m) {
        return '<div class="pcl-row">' +
          '<span class="pcl-label">' + m.l + '</span>' +
          '<div class="pcl-bar-wrap"><div class="pcl-bar" data-v="' + m.v + '"></div></div>' +
          '<span class="pcl-val">' + m.d + '</span>' +
        '</div>';
      }).join('');
      card.appendChild(lens);

      var hideTimer;
      function show() {
        clearTimeout(hideTimer);
        if (!lens.classList.contains('open')) {
          lens.classList.add('open');
          setTimeout(function() {
            lens.querySelectorAll('.pcl-bar').forEach(function(bar) {
              bar.style.width = (bar.getAttribute('data-v') || '0') + '%';
            });
          }, 30);
        }
      }
      function hide(immediate) {
        if (immediate) {
          clearTimeout(hideTimer);
          lens.classList.remove('open');
          lens.querySelectorAll('.pcl-bar').forEach(function(bar) { bar.style.width = '0%'; });
        } else {
          hideTimer = setTimeout(function() {
            lens.classList.remove('open');
            lens.querySelectorAll('.pcl-bar').forEach(function(bar) { bar.style.width = '0%'; });
          }, 180);
        }
      }

      if (caps.finePointer) {
        card.addEventListener('mouseenter', show);
        card.addEventListener('mouseleave', function() { hide(false); });
      } else {
        /* Mobile: tap anywhere on the card (not read-more) to toggle */
        card.addEventListener('click', function(e) {
          if (e.target && e.target.closest && e.target.closest('.pc-read-more')) return;
          lens.classList.contains('open') ? hide(true) : show();
        });
      }
      card.addEventListener('focusin', show);
      card.addEventListener('focusout', function() { hide(false); });
    });
  }

  /* ══════════════════════════════════════════════════
     RECRUITER MODE — orchestration only (panel render in recruiter.js)
     Owns: localStorage, body.recruiter-mode, header listeners, lazy load chain
     ══════════════════════════════════════════════════ */
  /* ── Dynamic script loader ── */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src     = src;
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initRecruiterMode() {
    var headerToggle = document.getElementById('header-rm-toggle');
    var headerToggleMobile = document.getElementById('header-rm-toggle-mobile');
    var allToggles = [headerToggle, headerToggleMobile].filter(Boolean);

    if (!allToggles.length) return;

    var _loadPromise = null;
    function loadRecruiterModule() {
      if (window.RecruiterBriefing) return Promise.resolve(window.RecruiterBriefing);
      if (_loadPromise) return _loadPromise;

      var cssLoaded = new Promise(function (resolve) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/recruiter.css';
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });

      _loadPromise = cssLoaded
        .then(function () { return loadScript('/assets/profile-facts.js'); })
        .then(function () { return loadScript('/assets/recruiter-data.js'); })
        .then(function () { return loadScript('/assets/recruiter.js'); })
        .then(function () { return window.RecruiterBriefing || {}; })
        .catch(function (err) {
          return {}; /* recruiter module degraded silently */
        });
      return _loadPromise;
    }

    function toggleBriefing(trigger) {
      loadRecruiterModule().then(function (m) {
        if (m && m.toggle) m.toggle(trigger);
      });
    }

    allToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleBriefing(btn);
      });
    });

    /* ── R8: Recruiter promo card — shown once per session when panel closed ── */
    (function initPromoCard() {
      try { if (sessionStorage.getItem('rm-promo') === '1') return; } catch(e) {}

      var promo = document.createElement('div');
      promo.id        = 'rm-promo';
      promo.className = 'rm-promo';
      promo.setAttribute('role', 'complementary');
      promo.setAttribute('aria-label', 'Recruiter shortcut');
      promo.innerHTML =
        '<div class="rm-promo-inner">' +
          '<span class="rm-promo-icon" aria-hidden="true">★</span>' +
          '<span class="rm-promo-text">Recruiter? Get a 90-second briefing on this portfolio.</span>' +
          '<button class="rm-promo-cta" type="button">Open briefing</button>' +
          '<button class="rm-promo-dismiss" type="button" aria-label="Dismiss recruiter shortcut">✕</button>' +
        '</div>';

      document.body.appendChild(promo);

      function dismiss() {
        promo.classList.add('rm-promo-out');
        document.body.classList.remove('rm-promo-active');
        document.documentElement.style.removeProperty('--promo-h');
        try { sessionStorage.setItem('rm-promo', '1'); } catch(e) {}
        window.__rmPromoDismiss = null;
        setTimeout(function () { if (promo.parentNode) promo.remove(); }, 350);
      }

      promo.querySelector('.rm-promo-dismiss').addEventListener('click', dismiss);
      promo.querySelector('.rm-promo-cta').addEventListener('click', function () {
        dismiss();
        toggleBriefing(promo.querySelector('.rm-promo-cta'));
      });

      window.__rmPromoDismiss = dismiss;

      setTimeout(function () {
        promo.classList.add('rm-promo-in');
        document.body.classList.add('rm-promo-active');
        requestAnimationFrame(function () {
          var h = promo.offsetHeight;
          if (h > 0) document.documentElement.style.setProperty('--promo-h', h + 'px');
        });
      }, 700);
    }());

    if (new URLSearchParams(location.search).get('recruiter') === '1') {
      loadRecruiterModule().then(function (m) {
        if (m && m.open) m.open(headerToggle || headerToggleMobile);
      });
    }
  }

  /* ══════════════════════════════════════════════════
     RESUME TOAST — feedback on resume download click
     ══════════════════════════════════════════════════ */
  function initResumeToast() {
    var toast = document.getElementById('copyToast');
    if (!toast) return;

    document.querySelectorAll('a[href="resume.pdf"]').forEach(function(link) {
      link.addEventListener('click', function() {
        toast.textContent = '⬇ Resume downloading…';
        toast.classList.add('show');
        setTimeout(function() { toast.classList.remove('show'); }, 2400);
      });
    });
  }

  /* ══════════════════════════════════════════════════
     C17 — CONTACT COUNTER ARC — character progress ring
     Initialized here (not contact.js) to guarantee execution.
     ══════════════════════════════════════════════════ */
  function initContactCounter() {
    var msgEl = document.getElementById('fmsg');
    if (!msgEl) return;
    var msgField = msgEl.closest('.field');
    if (!msgField || msgField.querySelector('.char-counter')) return;

    var MAX  = 500;
    var CIRC = 69.12; /* 2π × 11 */

    var wrap = document.createElement('div');
    wrap.className = 'char-counter';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 28 28">' +
        '<circle class="char-arc-bg" cx="14" cy="14" r="11"/>' +
        '<circle class="char-arc-fg" cx="14" cy="14" r="11"/>' +
      '</svg><span class="char-count-num"></span>';
    msgField.appendChild(wrap);

    var arcFg  = wrap.querySelector('.char-arc-fg');
    var numEl  = wrap.querySelector('.char-count-num');

    function update() {
      var len = msgEl.value.length;
      var pct = Math.min(len / MAX, 1);
      var left = MAX - len;
      arcFg.style.strokeDashoffset = (CIRC * (1 - pct)).toFixed(2);
      arcFg.classList.toggle('arc-warn', pct >= 0.8 && pct < 0.96);
      arcFg.classList.toggle('arc-full', pct >= 0.96);
      numEl.textContent = left >= 0 ? (left < 100 ? String(left) : '') : '!';
      numEl.style.color = pct >= 0.96 ? 'var(--error)' : pct >= 0.8 ? '#e8a020' : 'var(--ink-3)';
    }
    msgEl.addEventListener('input', update);
    update();
  }

  /* ══════════════════════════════════════════════════
     B9 — SECTION RAIL SYNC — aria-current on active section
     ══════════════════════════════════════════════════ */
  function initSectionRailSync() {
    if (!caps.iob) return;
    var sections = Array.from(document.querySelectorAll('section[id]'));
    var railLinks = Array.from(document.querySelectorAll('.section-rail a[href^="#"]'));
    if (!sections.length || !railLinks.length) return;

    var active = null;

    function setActive(id) {
      if (active === id) return;
      active = id;
      railLinks.forEach(function (a) {
        var isCurrent = a.getAttribute('href') === '#' + id;
        a.setAttribute('aria-current', isCurrent ? 'true' : 'false');
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ══════════════════════════════════════════════════
     B11 — TAG COLOR CODING — semantic tag categories
     ══════════════════════════════════════════════════ */
  function initTagColorCoding() {
    var MAP = {
      'react': 'tc-js', 'reactjs': 'tc-js', 'typescript': 'tc-js',
      'javascript': 'tc-js', 'next.js': 'tc-js', 'redux': 'tc-js',
      'zustand': 'tc-js', 'react native': 'tc-js', 'react query': 'tc-js',
      'playwright': 'tc-test', 'jest': 'tc-test', 'cypress': 'tc-test',
      'react testing library': 'tc-test', 'e2e / unit / integration': 'tc-test',
      'agentic ai': 'tc-ai', 'llm': 'tc-ai', 'llm streaming': 'tc-ai',
      'openai api': 'tc-ai', 'langchain': 'tc-ai', 'rag': 'tc-ai',
      'tool calling': 'tc-ai', 'anomaly detection': 'tc-ai',
      'prompt engineering': 'tc-ai', 'data visualisation': 'tc-ai',
      'microfrontends': 'tc-arch', 'webpack module federation': 'tc-arch',
      'design systems': 'tc-arch', 'storybook': 'tc-arch', 'ssr': 'tc-arch',
      'ssr / ssg': 'tc-arch', 'wcag 2.1': 'tc-arch', 'accessibility': 'tc-arch',
      'monorepo': 'tc-arch', 'perf budgets': 'tc-arch', 'performance': 'tc-arch',
      'a/b testing': 'tc-arch', 'offline-first': 'tc-arch',
      'webpack': 'tc-tool', 'vite': 'tc-tool', 'turborepo': 'tc-tool',
      'nx': 'tc-tool', 'github actions': 'tc-tool', 'docker': 'tc-tool',
      'ci/cd': 'tc-tool', 'lighthouse': 'tc-tool', 'lighthouse ci': 'tc-tool',
      'ast codemods': 'tc-tool', 'vs code api': 'tc-tool',
      'd3.js': 'tc-data', 'highcharts': 'tc-data', 'recharts': 'tc-data',
      'leaflet': 'tc-data', 'graphql': 'tc-data', 'rest / openapi': 'tc-data'
    };
    document.querySelectorAll('.tag').forEach(function (tag) {
      var cls = MAP[tag.textContent.trim().toLowerCase()];
      if (cls) tag.classList.add(cls);
    });
  }

  /* ══════════════════════════════════════════════════
     D22 — CURSOR SPOTLIGHT — radial glow follows mouse
     Fine pointer only; very subtle opacity.
     ══════════════════════════════════════════════════ */
  function initCursorSpotlight() {
    if (!caps.finePointer || caps.reducedMotion) return;
    var el = document.createElement('div');
    el.className = 'cursor-spotlight';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    var rafId = null;
    document.addEventListener('mousemove', function (e) {
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        el.style.setProperty('--sx', e.clientX + 'px');
        el.style.setProperty('--sy', e.clientY + 'px');
        rafId = null;
      });
    });
  }

  /* ══════════════════════════════════════════════════
     D23 — HERO PARALLAX — dot-grid recedes on scroll
     ══════════════════════════════════════════════════ */
  function initHeroParallax() {
    if (caps.reducedMotion) return;
    var hero = document.getElementById('hero');
    if (!hero) return;
    var lastY = -1, rafId;
    function update() {
      var y = window.scrollY;
      if (y === lastY) { rafId = null; return; }
      lastY = y;
      document.documentElement.style.setProperty('--hero-scroll', y + 'px');
      rafId = null;
    }
    window.addEventListener('scroll', function () {
      if (!rafId) rafId = requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     D25 — PROGRESS RING — circular scroll arc, fixed BR
     ══════════════════════════════════════════════════ */
  function initProgressRing() {
    var CIRC = 113.1; /* 2π × 18 */
    var outer = document.createElement('div');
    outer.className = 'progress-ring-outer';
    outer.setAttribute('aria-hidden', 'true');
    outer.innerHTML = '<svg width="44" height="44" viewBox="0 0 44 44">' +
      '<circle class="progress-ring-bg" cx="22" cy="22" r="18"/>' +
      '<circle class="progress-ring-arc" cx="22" cy="22" r="18"/>' +
      '</svg>';
    document.body.appendChild(outer);
    var arc = outer.querySelector('.progress-ring-arc');

    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var pct = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      arc.style.strokeDashoffset = (CIRC * (1 - pct)).toFixed(2);
      outer.classList.toggle('visible', window.scrollY > 200);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ══════════════════════════════════════════════════
     D26 — KEYBOARD SECTION NAV — ArrowLeft / ArrowRight
     ══════════════════════════════════════════════════ */
  function initKeyboardSectionNav() {
    var sections = Array.from(document.querySelectorAll('section[id]'));
    var announce = document.getElementById('shortcut-announce');
    if (!sections.length) return;

    document.addEventListener('keydown', function (e) {
      if (e.target && e.target.matches && e.target.matches('input,textarea,select,[contenteditable]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      var current = 0;
      sections.forEach(function (s, i) {
        if (s.getBoundingClientRect().top <= window.innerHeight * 0.6) current = i;
      });
      var target = e.key === 'ArrowRight'
        ? Math.min(current + 1, sections.length - 1)
        : Math.max(current - 1, 0);
      sections[target].scrollIntoView({ behavior: 'smooth' });
      if (announce) {
        announce.textContent = 'Navigated to ' + sections[target].id + ' section';
        setTimeout(function () { announce.textContent = ''; }, 2000);
      }
      e.preventDefault();
    });
  }

  /* ══════════════════════════════════════════════════
     E29 — MOBILE FAB — contact shortcut on touch devices
     ══════════════════════════════════════════════════ */
  function initMobileFab() {
    var fab = document.getElementById('contactFab');
    if (!fab || !caps.coarsePointer) return;

    function toggleFab() {
      fab.classList.toggle('fab-visible', window.scrollY > 400);
    }
    window.addEventListener('scroll', toggleFab, { passive: true });
    toggleFab();

    fab.addEventListener('click', function () {
      var contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
      var field = document.getElementById('fname');
      setTimeout(function () { if (field) field.focus(); }, 600);
    });
  }

  /* ══════════════════════════════════════════════════
     E30 — HAPTIC FEEDBACK — vibrate on key interactions
     ══════════════════════════════════════════════════ */
  function initHapticFeedback() {
    if (!navigator.vibrate) return;

    /* Copy email → 1 short pulse */
    var copyBtn = document.getElementById('copyEmailBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () { navigator.vibrate(40); });

    /* Theme change → 2 quick taps */
    document.addEventListener('themechange', function () { navigator.vibrate([20, 40, 20]); });

    /* Form send success → triple pulse */
    document.addEventListener('form-success', function () { navigator.vibrate([30, 30, 30, 30, 60]); });
  }

  /* ══════════════════════════════════════════════════
     E31 — FACTS STRIP DOTS — scroll position indicator
     ══════════════════════════════════════════════════ */
  function initFactsDots() {
    var strip = document.querySelector('.hero-facts');
    if (!strip || !caps.coarsePointer) return;
    var facts = strip.querySelectorAll('.hero-fact');
    if (facts.length < 3) return;

    var dotsEl = document.createElement('div');
    dotsEl.className = 'facts-dots';
    dotsEl.setAttribute('aria-hidden', 'true');
    var N = Math.min(facts.length, 6);
    for (var i = 0; i < N; i++) {
      var d = document.createElement('span');
      d.className = 'facts-dot' + (i === 0 ? ' facts-dot--active' : '');
      dotsEl.appendChild(d);
    }
    strip.parentNode.insertBefore(dotsEl, strip.nextSibling);

    strip.addEventListener('scroll', function () {
      var pct = strip.scrollLeft / (strip.scrollWidth - strip.clientWidth);
      var idx = Math.round(pct * (N - 1));
      Array.from(dotsEl.children).forEach(function (d, i) {
        d.classList.toggle('facts-dot--active', i === idx);
      });
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     E32 — MOBILE NAV SWIPE — swipe left to close drawer
     ══════════════════════════════════════════════════ */
  function initMobileNavSwipe() {
    var nav = document.getElementById('mobile-nav');
    if (!nav || !caps.coarsePointer) return;
    var startX = 0, startY = 0, tracking = false;

    nav.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    nav.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var dx = e.touches[0].clientX - startX;
      var dy = Math.abs(e.touches[0].clientY - startY);
      if (dx >= 0 || dy > Math.abs(dx) * 1.2) { tracking = false; return; }
      nav.style.transform = 'translateX(' + (-dx) + 'px)';
    }, { passive: true });

    nav.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.changedTouches[0].clientX - startX;
      nav.style.transition = 'transform .3s cubic-bezier(.16,1,.3,1)';
      if (dx < -80) {
        var closeBtn = document.getElementById('mobile-nav-close');
        if (closeBtn) closeBtn.click();
      }
      nav.style.transform = '';
      setTimeout(function () { nav.style.transition = ''; }, 320);
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     G38 — DYNAMIC TENURE — live years/months counters
     ══════════════════════════════════════════════════ */
  function initDynamicTenure() {
    var CAREER_START = new Date('2019-06-01'); /* first professional role: Vassar Labs */
    var ROLE_START   = new Date('2025-09-01'); /* Lifesight */
    var now = new Date();

    function diffMonths(a, b) {
      return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    }

    var totalYrs = Math.floor(diffMonths(CAREER_START, now) / 12);
    var roleM    = diffMonths(ROLE_START, now);
    var rolePart = roleM >= 12
      ? Math.floor(roleM / 12) + 'y ' + (roleM % 12 > 0 ? roleM % 12 + 'm' : '')
      : roleM + ' month' + (roleM !== 1 ? 's' : '');

    /* Update stat-n "7+" and hero fact strip */
    document.querySelectorAll('.stat-n').forEach(function (el) {
      if (el.textContent.trim() === '7+') el.textContent = totalYrs + '+';
    });
    document.querySelectorAll('.hero-fact').forEach(function (el) {
      if (el.textContent.includes('7+')) {
        var dot = el.querySelector('.fact-dot');
        el.textContent = totalYrs + '+ years';
        if (dot) el.insertBefore(dot, el.firstChild);
      }
    });

    /* Hero card experience line */
    document.querySelectorAll('.hc-val').forEach(function (v) {
      if (v.textContent.includes('years · SaaS')) {
        v.textContent = totalYrs + '+ years · SaaS & GovTech';
      }
    });

    /* Add role tenure note to hero card "currently" section */
    var hcCurrently = document.querySelector('.hc-status');
    if (hcCurrently && !hcCurrently.querySelector('.hc-tenure')) {
      var t = document.createElement('span');
      t.className = 'hc-tenure';
      t.textContent = ' · ' + rolePart;
      t.style.cssText = 'font-size:11px;opacity:.55;font-family:var(--mono);';
      hcCurrently.appendChild(t);
    }
  }

  /* ══════════════════════════════════════════════════
     G39 — CASEBOOK COUNT — fetch live case count
     ══════════════════════════════════════════════════ */
  function initCasebookCount() {
    var cta = document.querySelector('.casebook-cta__title');
    if (!cta) return;
    fetch('/cases/')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        /* Count <article> or .case-card occurrences */
        var n = (html.match(/class="[^"]*case-card[^"]*"/g) || []).length
              || (html.match(/<article\b/g) || []).length;
        if (!n || n > 200) return;
        var badge = document.createElement('span');
        badge.className = 'casebook-count-badge';
        badge.textContent = n + ' cases';
        cta.appendChild(badge);
      })
      .catch(function () {});
  }

  /* ══════════════════════════════════════════════════
     G40 — PIPELINE PROGRESS — status bars on wi items
     ══════════════════════════════════════════════════ */
  function initPipelineProgress() {
    var MAP = { 'Draft': 75, 'Outline': 55, 'Research': 30, 'Idea': 10 };
    document.querySelectorAll('.wi-badge').forEach(function (badge) {
      var text = badge.textContent.trim();
      var pct  = MAP[text];
      if (!pct) return;
      var wi = badge.closest('.wi');
      if (!wi) return;
      wi.setAttribute('data-status', text);
      wi.setAttribute('data-progress', '1');
      /* Animate width when element enters viewport */
      if (caps.iob) {
        var obs = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            wi.style.setProperty('--wi-pct', pct + '%');
            obs.unobserve(wi);
          }
        }, { threshold: 0.3 });
        obs.observe(wi);
      } else {
        wi.style.setProperty('--wi-pct', pct + '%');
      }
    });
  }

  /* ══════════════════════════════════════════════════
     G41 — CAREER BAR — proportional tenure segments
     ══════════════════════════════════════════════════ */
  function initCareerBar() {
    var bar = document.getElementById('careerBar');
    if (!bar) return;
    var segs = Array.from(bar.querySelectorAll('.career-seg'));
    var now  = new Date();

    function toDate(str) { return str === 'present' ? now : new Date(str + '-01'); }
    function months(a, b) {
      return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    }

    var totals = segs.map(function (s) {
      return Math.max(1, months(toDate(s.dataset.from), toDate(s.dataset.to)));
    });
    var sum = totals.reduce(function (a, b) { return a + b; }, 0);

    segs.forEach(function (s, i) {
      s.style.flexGrow = (totals[i] / sum * 10).toFixed(2);
      /* Add tooltip */
      s.setAttribute('title', s.dataset.company + ' · ' + totals[i] + ' months');
    });
  }

  /* ══════════════════════════════════════════════════
     C20 — RECRUITER PANEL EMAIL PRE-FILL
     ══════════════════════════════════════════════════ */
  function initRecruiterPrefill() {
    /* The recruiter panel email link is .rm-foot-btn[href^="mailto"] */
    /* Intercept it and navigate to contact + prefill instead */
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.rm-foot-btn');
      if (!btn) return;
      var href = btn.getAttribute('href') || '';
      if (!href.startsWith('mailto')) return;
      e.preventDefault();
      /* Close panel if open */
      if (window.RecruiterBriefing && window.RecruiterBriefing.close) {
        window.RecruiterBriefing.close();
      }
      var contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () {
        var msg = document.getElementById('fmsg');
        var name = document.getElementById('fname');
        if (msg && !msg.value) {
          msg.value = "Hi Animesh, I came across your portfolio and wanted to reach out. ";
          msg.dispatchEvent(new Event('input'));
        }
        if (name) name.focus();
      }, 700);
    });
  }

  /* ══════════════════════════════════════════════════
     H46 — PERFORMANCE DEBUG PANEL — Shift+P shortcut
     ══════════════════════════════════════════════════ */
  function initPerfShortcut() {
    var metrics = {};

    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(function (l) {
          l.getEntries().forEach(function (e) {
            if (e.name === 'first-contentful-paint') metrics.FCP = (e.startTime / 1000).toFixed(2) + 's';
          });
        }).observe({ entryTypes: ['paint'] });
        new PerformanceObserver(function (l) {
          l.getEntries().forEach(function (e) { metrics.LCP = (e.startTime / 1000).toFixed(2) + 's'; });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        new PerformanceObserver(function (l) {
          var cls = 0;
          l.getEntries().forEach(function (e) { if (!e.hadRecentInput) cls += e.value; });
          metrics.CLS = cls.toFixed(4);
        }).observe({ entryTypes: ['layout-shift'] });
      } catch (e) {}
    }

    var panel = null;
    document.addEventListener('keydown', function (e) {
      if (!e.shiftKey || e.key !== 'P') return;
      if (e.target && e.target.matches && e.target.matches('input,textarea,select,[contenteditable]')) return;

      if (panel && panel.isConnected) { panel.remove(); panel = null; return; }

      var nav = performance.getEntriesByType('navigation')[0] || {};
      var jsSz = performance.getEntriesByType('resource')
        .filter(function (r) { return r.initiatorType === 'script'; })
        .reduce(function (a, r) { return a + (r.encodedBodySize || 0); }, 0);

      panel = document.createElement('div');
      panel.className = 'perf-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Performance metrics');
      panel.innerHTML = '<div class="perf-panel-inner">' +
        '<p class="perf-panel-label">// perf · ' + window.location.pathname + '</p>' +
        '<div class="perf-row"><span>LCP</span><strong>' + (metrics.LCP || '–') + '</strong></div>' +
        '<div class="perf-row"><span>FCP</span><strong>' + (metrics.FCP || '–') + '</strong></div>' +
        '<div class="perf-row"><span>CLS</span><strong>' + (metrics.CLS || '–') + '</strong></div>' +
        '<div class="perf-row"><span>TTFB</span><strong>' + (nav.responseStart ? (nav.responseStart / 1000).toFixed(2) + 's' : '–') + '</strong></div>' +
        '<div class="perf-row"><span>JS xfr</span><strong>' + (jsSz ? Math.round(jsSz / 1024) + 'KB' : '–') + '</strong></div>' +
        '<div class="perf-row"><span>Resources</span><strong>' + performance.getEntriesByType('resource').length + '</strong></div>' +
        '<p class="perf-panel-hint">Shift+P to close</p>' +
        '</div>';
      document.body.appendChild(panel);
      panel.querySelector('.perf-panel-inner').addEventListener('click', function (ev) { ev.stopPropagation(); });
      panel.addEventListener('click', function () { panel.remove(); panel = null; });
    });
  }

  /* ══════════════════════════════════════════════════
     A2 — HERO NAME REVEAL — character-by-character entrance
     Runs every page load; gracefully skips if reducedMotion.
     ══════════════════════════════════════════════════ */
  function initHeroNameReveal() {
    var nameEl = document.querySelector('.hero-name');
    if (!nameEl || caps.reducedMotion) return;

    var charDelay = 22;  // ms per character
    var baseDelay = 120; // ms before first character (aligns with hero-in stagger)

    var nodes = Array.from(nameEl.childNodes);
    nameEl.innerHTML = '';
    nameEl.classList.add('hero-name--split');
    nameEl.setAttribute('aria-label', 'Animesh Pandey');

    var idx = 0;
    nodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split('').forEach(function (ch) {
          var span = document.createElement('span');
          span.className = 'hero-char';
          span.textContent = ch === ' ' ? ' ' : ch;
          span.style.animationDelay = (baseDelay + idx * charDelay) + 'ms';
          nameEl.appendChild(span);
          idx++;
        });
      } else if (node.nodeName === 'BR') {
        nameEl.appendChild(document.createElement('br'));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        /* .dot span and any other inline elements — animate as a block */
        var cloned = node.cloneNode(true);
        cloned.style.display         = 'inline-block';
        cloned.style.opacity         = '0';
        cloned.style.animationDelay  = (baseDelay + idx * charDelay + 60) + 'ms';
        cloned.style.animation       = 'char-in 0.42s cubic-bezier(.16,1,.3,1) both';
        cloned.style.willChange      = 'opacity, transform';
        nameEl.appendChild(cloned);
      }
    });
  }

  /* ══════════════════════════════════════════════════
     A1 — SECTION LABEL TYPEWRITER — types out // labels
     Fires once per session per label via IntersectionObserver.
     ══════════════════════════════════════════════════ */
  function initSectionLabelTypewriter() {
    if (caps.reducedMotion || !caps.iob) return;

    var CHAR_DELAY = 14; // ms per character — "// experience" types in ~182 ms

    function typeLabel(el) {
      var text = el.textContent.trim();
      if (!text || el.dataset.typed) return;
      el.dataset.typed = '1';
      el.setAttribute('aria-label', text); // preserve full text for screen readers
      el.textContent = '';
      text.split('').forEach(function (ch, i) {
        setTimeout(function () { el.textContent += ch; }, i * CHAR_DELAY);
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        typeLabel(entry.target);
      });
    }, { threshold: 0.9 });

    document.querySelectorAll('.section-label').forEach(function (el) { io.observe(el); });
  }

  /* ══════════════════════════════════════════════════
     A3 — MAGNETIC CTAs — hero primary buttons attract to cursor
     Fine pointer + motion-OK only. Hero CTAs only.
     ══════════════════════════════════════════════════ */
  function initMagneticCtas() {
    if (!caps.finePointer || caps.reducedMotion) return;

    var hero = document.getElementById('hero');
    if (!hero) return;

    var MAX = 9; // px max pull in each axis

    hero.querySelectorAll('.btn-dark, .btn-outline').forEach(function (btn) {
      var rafId, active = false;

      btn.addEventListener('mouseenter', function () {
        active = true;
        btn.style.transition = 'transform 0.12s ease, background 0.2s, color 0.2s, border-color 0.2s';
      });

      btn.addEventListener('mousemove', function (e) {
        if (!active) return;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          var r  = btn.getBoundingClientRect();
          var dx = ((e.clientX - (r.left + r.width  * 0.5)) / (r.width  * 0.5)) * MAX;
          var dy = ((e.clientY - (r.top  + r.height * 0.5)) / (r.height * 0.5)) * MAX;
          btn.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
        });
      });

      btn.addEventListener('mouseleave', function () {
        active = false;
        cancelAnimationFrame(rafId);
        btn.style.transition = 'transform 0.55s cubic-bezier(.16,1,.3,1), background 0.2s, color 0.2s, border-color 0.2s';
        btn.style.transform  = 'translate(0,0)';
        setTimeout(function () {
          btn.style.transition = '';
          btn.style.transform  = '';
        }, 560);
      });
    });
  }

  /* ══════════════════════════════════════════════════
     A8 — FAQ SVG MORPH — inline SVG + to − via scaleY
     Replaces CSS ::after text content with an animated SVG.
     MutationObserver handles i18n-injected FAQ items.
     ══════════════════════════════════════════════════ */
  function initFaqSvgMorph() {
    function morphify(q) {
      if (q.querySelector('.faq-icon')) return; // idempotent
      var icon = document.createElement('span');
      icon.className = 'faq-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"' +
        ' stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
          '<line x1="2" y1="7" x2="12" y2="7"/>' +
          '<line class="faq-v-line" x1="7" y1="2" x2="7" y2="12"/>' +
        '</svg>';
      q.appendChild(icon);
    }

    document.querySelectorAll('.faq-q').forEach(morphify);

    /* Watch for i18n-injected FAQ items added after initial parse */
    if ('MutationObserver' in window) {
      var container = document.querySelector('.faq-list');
      if (container) {
        new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
              if (node.nodeType !== 1) return;
              if (node.classList && node.classList.contains('faq-q')) { morphify(node); return; }
              if (node.querySelectorAll) node.querySelectorAll('.faq-q').forEach(morphify);
            });
          });
        }).observe(container, { childList: true, subtree: true });
      }
    }
  }

  /* ══════════════════════════════════════════════════
     THEME CROSS-FADE — smooth token transition
     Uses View Transitions API (Chrome 111+, Safari 18+) for a
     clip-path ripple from the picker button. JS fallback for Firefox.
     ══════════════════════════════════════════════════ */
  function initThemeCrossfade() {
    var supportsVT     = !caps.reducedMotion && typeof document.startViewTransition === 'function';
    var originalApply  = window.applyTheme;
    if (!originalApply) return;

    /* Capture picker button rect on menu open — used as the ripple origin */
    var rippleX = null, rippleY = null;

    document.querySelectorAll('.theme-pick-btn').forEach(function (btn) {
      if (btn.classList.contains('lang-pick-btn') || btn.id === 'casebook-prefs-btn') return;

      btn.addEventListener('click', function () {
        if (!supportsVT) {
          /* CSS-class fallback: briefly add class that transitions colour surfaces */
          var html = document.documentElement;
          html.classList.add('theme-transitioning');
          setTimeout(function () { html.classList.remove('theme-transitioning'); }, 320);
          return;
        }
        var r  = btn.getBoundingClientRect();
        rippleX = (r.left + r.width  * 0.5).toFixed(0) + 'px';
        rippleY = (r.top  + r.height * 0.5).toFixed(0) + 'px';
      }, /* capture — fires before prefs-chrome.js menu handler */ true);
    });

    if (!supportsVT) return;

    /* Wrap window.applyTheme so calls with a pending ripple use startViewTransition */
    window.applyTheme = function (id) {
      if (!rippleX) { originalApply(id); return; }
      var x = rippleX, y = rippleY;
      rippleX = rippleY = null;
      document.documentElement.style.setProperty('--ripple-x', x);
      document.documentElement.style.setProperty('--ripple-y', y);
      document.startViewTransition(function () { originalApply(id); });
    };
  }

  /* ══════════════════════════════════════════════════
     HIRE SHORTCUT — typing "hire" scrolls to contact
     ══════════════════════════════════════════════════ */
  function initHireShortcut() {
    var buf = '', timer;
    var announce = document.getElementById('shortcut-announce');

    document.addEventListener('keydown', function(e) {
      if (e.target && e.target.matches && e.target.matches('input,textarea,select,[contenteditable]')) { buf = ''; return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      clearTimeout(timer);
      buf += e.key.toLowerCase();
      if (buf.length > 4) buf = buf.slice(-4);
      timer = setTimeout(function() { buf = ''; }, 2000);
      if (buf.endsWith('hire')) {
        buf = '';
        var contact = document.getElementById('contact');
        if (!contact) return;
        contact.scrollIntoView({ behavior: 'smooth' });
        var field = document.getElementById('fname');
        setTimeout(function() { if (field) field.focus(); }, 700);
        if (announce) {
          announce.textContent = 'Jumped to contact section - type your name to get in touch';
          setTimeout(function() { announce.textContent = ''; }, 3000);
        }
      }
    });
  }

}());
