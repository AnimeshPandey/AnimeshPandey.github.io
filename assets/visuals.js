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
    initScrollReveal();
    if (caps.canvas2d && !caps.reducedMotion && !caps.saveData) initHeroCanvas();
    initHeroChrome();
    initStatCountUp();
    initCardExpand();
    initCardTilt();
    initTagStagger();
    initArticleTap();
    initEggs();
    initSkillsConstellationHint();
    initThemeWink();
    if (caps.iob) initTimelineHighlight();
    initImpactLens();
    initRecruiterMode();
    initResumeToast();
    if (!caps.reducedMotion) initThemeCrossfade();
    initHireShortcut();
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

  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js');
    });
  }

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
    document.querySelectorAll('.pc-desc').forEach(function (desc) {
      /* Only add toggle if text is actually clamped */
      if (desc.scrollHeight <= desc.clientHeight + 2) return;

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
        card.style.transitionProperty = 'border-color, box-shadow';
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
      .catch(function (err) { console.warn('[eggs] load failed', err); });
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
     ══════════════════════════════════════════════════ */
  function initTimelineHighlight() {
    var items = document.querySelectorAll('.t-item');
    if (!items.length) return;

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
          console.warn('[recruiter] module load failed', err);
          return {};
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
     THEME CROSS-FADE — smooth token transition
     ══════════════════════════════════════════════════ */
  function initThemeCrossfade() {
    document.querySelectorAll('.theme-pick-btn').forEach(function (btn) {
      if (btn.classList.contains('lang-pick-btn') || btn.id === 'casebook-prefs-btn') return;
      btn.addEventListener('click', function () {
        var html = document.documentElement;
        html.classList.add('theme-transitioning');
        setTimeout(function () { html.classList.remove('theme-transitioning'); }, 320);
      }, true);
    });
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
