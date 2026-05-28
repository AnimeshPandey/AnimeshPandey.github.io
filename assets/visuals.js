/* visuals.js — orchestrator: canvas particle field + easter eggs
   Lazy-loads visuals.d3.js and visuals.three.js on demand.
   All effects degrade gracefully; none are required for content. */
(function () {
  'use strict';

  /* ── Utilities ──────────────────────────────────── */
  function mq(q) { return window.matchMedia(q).matches; }

  function loadScript(src, cb, onErr) {
    var s = document.createElement('script');
    s.src = src;
    s.onerror = function () { if (onErr) onErr(); };
    if (cb) s.onload = cb;
    document.head.appendChild(s);
  }

  /* ── Capability gate ─────────────────────────────── */
  var conn = navigator.connection || {};
  var caps = {
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    finePointer:   mq('(pointer: fine)'),
    coarsePointer: mq('(pointer: coarse)'),
    saveData:      !!(conn.saveData || /^(2g|slow-2g)$/.test(conn.effectiveType)),
    canvas2d:      (function () { try { return !!document.createElement('canvas').getContext('2d'); } catch (e) { return false; } }()),
    iob:           'IntersectionObserver' in window
  };

  /* ── Boot ────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    if (caps.canvas2d && !caps.reducedMotion && !caps.saveData) initHeroCanvas();
    lazyLoadD3();
    initMobileEgg();
    initDesktopEgg();
  }

  /* ══════════════════════════════════════════════════
     HERO CANVAS — 2D particle constellation
     Canvas 2D achieves same visual as Three.js for a
     flat particle network at zero CDN cost.
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

    /* Particle state */
    var px = new Float32Array(N), py = new Float32Array(N);
    var pz = new Float32Array(N); /* depth 0.4–1 for size/opacity scaling */
    var vx = new Float32Array(N), vy = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      px[i] = Math.random() * W;
      py[i] = Math.random() * H;
      pz[i] = 0.4 + Math.random() * 0.6;
      vx[i] = (Math.random() - 0.5) * 0.2;
      vy[i] = (Math.random() - 0.5) * 0.13;
    }

    /* Mouse repulsion (fine pointer only) */
    var mx = -999, my = -999;
    if (caps.finePointer) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
      });
      hero.addEventListener('mouseleave', function () { mx = -999; my = -999; });
    }

    function isDark() { return document.documentElement.dataset.theme === 'dark'; }

    var running = true;
    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);

      var dark = isDark();
      var dotBase  = dark ? '240,230,218,' : '80,55,35,';
      var lineBase = dark ? '220,210,200,' : '100,75,50,';

      for (var j = 0; j < N; j++) {
        /* Move */
        px[j] += vx[j]; py[j] += vy[j];
        /* Soft bounce */
        if (px[j] < 0 || px[j] > W) vx[j] *= -1;
        if (py[j] < 0 || py[j] > H) vy[j] *= -1;
        /* Mouse repulsion */
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
        /* Draw dot */
        ctx.beginPath();
        ctx.arc(px[j], py[j], pz[j] * (mobile ? 1.4 : 1.8), 0, 6.2832);
        ctx.fillStyle = 'rgba(' + dotBase + (pz[j] * 0.32).toFixed(2) + ')';
        ctx.fill();
      }

      /* Connections */
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

    /* Fade in after first paint */
    requestAnimationFrame(function () { requestAnimationFrame(function () { canvas.style.opacity = '1'; }); });
    loop();

    /* Pause when hero is off-screen */
    if (caps.iob) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running) loop();
      }, { threshold: 0 }).observe(hero);
    }

    /* Resize */
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
     D3 SKILLS GRAPH — lazy via IntersectionObserver
     ══════════════════════════════════════════════════ */
  function lazyLoadD3() {
    var skillsEl = document.getElementById('skills');
    if (!skillsEl) return;

    function load() {
      if (window.__d3Loaded) return;
      window.__d3Loaded = true;
      loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', function () {
        loadScript('/assets/visuals.d3.js');
      });
    }

    if (caps.iob) {
      var obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect(); load();
      }, { rootMargin: '300px' });
      obs.observe(skillsEl);
    } else {
      load();
    }
  }

  /* ══════════════════════════════════════════════════
     MOBILE EASTER EGG — tap badge → insight card
     Discoverable: badge shows "✦ Tap for insights"
     hint that fades in 1.5s after load.
     ══════════════════════════════════════════════════ */
  function initMobileEgg() {
    /* Show on touch devices; fine-pointer users get the desktop egg */
    if (caps.finePointer && !caps.coarsePointer) return;

    var badge = document.querySelector('#hero .badge');
    if (!badge) return;

    /* Make badge interactive */
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('aria-label', 'Open to senior and staff roles — tap for career snapshot');
    badge.style.cursor = 'pointer';

    /* Discoverable hint text */
    var hint = document.createElement('p');
    hint.className = 'egg-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = '✦  Tap badge for career snapshot';
    badge.parentNode.insertBefore(hint, badge.nextSibling);

    /* Fade hint in after 1.5s, fade out after 7s */
    setTimeout(function () { hint.classList.add('visible'); }, 1500);
    setTimeout(function () { hint.classList.remove('visible'); }, 7000);

    /* Build slide-up insight card */
    var card = document.createElement('div');
    card.className = 'egg-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-label', 'Career snapshot');
    card.innerHTML =
      '<div class="egg-card-inner">' +
        '<p class="egg-card-label">// career snapshot</p>' +
        '<div class="egg-rows">' +
          '<div class="egg-row"><span class="egg-n">7+</span><span class="egg-l">years shipping</span></div>' +
          '<div class="egg-row"><span class="egg-n">5</span><span class="egg-l">products built</span></div>' +
          '<div class="egg-row"><span class="egg-n">50k+</span><span class="egg-l">daily users</span></div>' +
          '<div class="egg-row"><span class="egg-n">3</span><span class="egg-l">domains</span></div>' +
        '</div>' +
        '<p class="egg-note">SaaS · GovTech · Automotive Retail</p>' +
        '<button class="egg-close" aria-label="Close career snapshot">✕ close</button>' +
      '</div>';
    document.body.appendChild(card);

    var open = false, timer;
    function openCard() {
      if (open) return;
      open = true;
      card.classList.add('open');
      card.querySelector('.egg-close').focus();
      hint.classList.remove('visible');
      timer = setTimeout(closeCard, 6000);
    }
    function closeCard() {
      open = false; clearTimeout(timer);
      card.classList.remove('open');
      badge.focus();
    }

    badge.addEventListener('click', openCard);
    badge.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open ? closeCard() : openCard(); }
    });
    card.querySelector('.egg-close').addEventListener('click', closeCard);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) closeCard();
    });
  }

  /* ══════════════════════════════════════════════════
     DESKTOP EASTER EGG — ? key → Three.js constellation
     Discoverable: a visible [ press ? ] button sits at
     the bottom-right corner of the hero section.
     ══════════════════════════════════════════════════ */
  function initDesktopEgg() {
    if (!caps.finePointer) return;

    var hero = document.getElementById('hero');
    if (!hero) return;

    /* Visible hint button in hero */
    var hint = document.createElement('button');
    hint.className = 'egg-key-hint';
    hint.setAttribute('aria-label', 'Press ? to launch interactive tech constellation');
    hint.innerHTML = '<span aria-hidden="true">[ press ? ]</span>';
    hero.appendChild(hint);

    /* Show hint after 2s */
    setTimeout(function () { hint.classList.add('visible'); }, 2000);

    var eggActive = false;

    function trigger() {
      if (eggActive) return;
      eggActive = true;
      hint.classList.remove('visible');

      function launch() {
        if (typeof window.__launchThreeEgg === 'function') {
          window.__launchThreeEgg(function () {
            eggActive = false;
            hint.classList.add('visible');
          });
        } else {
          eggActive = false;
        }
      }

      function onFail() { eggActive = false; hint.classList.add('visible'); }

      if (window.THREE && window.__threeEggReady) {
        launch();
      } else if (window.THREE) {
        loadScript('/assets/visuals.three.js', launch, onFail);
      } else {
        loadScript('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.min.js', function () {
          loadScript('/assets/visuals.three.js', launch, onFail);
        }, onFail);
      }
    }

    hint.addEventListener('click', trigger);
    hint.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
    });

    /* Also respond to ? key */
    document.addEventListener('keydown', function (e) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.target.closest('input, textarea, [contenteditable]')) {
        trigger();
      }
    });
  }

}());
