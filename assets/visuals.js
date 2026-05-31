/* visuals.js — orchestrator: hero canvas particle field + skills toggle + card expand
   Mobile easter egg (badge → career snapshot) also lives here.
   All effects degrade gracefully; none are required for content.
   Emergency kill-switch: set window.__VISUALS_DISABLED = true before this script loads. */
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
    if (caps.canvas2d && !caps.reducedMotion && !caps.saveData) initHeroCanvas();
    initCardExpand();
    initCardTilt();
    initTagStagger();
    initArticleTap();
    initMobileEgg();
    if (caps.finePointer && caps.canvas2d && !caps.reducedMotion) initDesktopEgg();
    if (caps.iob) initTimelineHighlight();
    initImpactLens();
    initRecruiterMode();
    initResumeToast();
    if (!caps.reducedMotion) initThemeCrossfade();
    initHireShortcut();
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
     MOBILE EASTER EGG — tap badge → career snapshot
     Hint text fades in 1.5s after load.
     ══════════════════════════════════════════════════ */
  function initMobileEgg() {
    if (caps.finePointer && !caps.coarsePointer) return;

    var badge = document.querySelector('#hero .badge');
    if (!badge) return;

    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('aria-label', 'Open to senior and staff roles — tap for career snapshot');
    badge.style.cursor = 'pointer';

    var hint = document.createElement('p');
    hint.className = 'egg-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = '✦  Tap badge for career snapshot';
    badge.parentNode.insertBefore(hint, badge.nextSibling);

    setTimeout(function () { hint.classList.add('visible'); }, 1500);
    setTimeout(function () { hint.classList.remove('visible'); }, 7000);

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
     DESKTOP EASTER EGG — Canvas 2D skill constellation
     ?  key triggers; ESC / button closes; 12s auto-close
     ══════════════════════════════════════════════════ */
  function initDesktopEgg() {
    /* Create overlay */
    var overlay = document.createElement('div');
    overlay.id = 'egg-desktop-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Skills constellation');
    overlay.setAttribute('tabindex', '-1');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="egg-desktop-ui">' +
        '<p class="egg-desktop-title">// skills constellation</p>' +
        '<p class="egg-desktop-hint">drag to rotate · esc to close</p>' +
        '<button class="egg-desktop-close" aria-label="Close skills constellation">✕ close</button>' +
      '</div>' +
      '<canvas id="egg-desktop-canvas" aria-hidden="true"></canvas>';
    document.body.appendChild(overlay);

    var canvas = document.getElementById('egg-desktop-canvas');
    var ctx = canvas.getContext('2d');
    var closeBtn = overlay.querySelector('.egg-desktop-close');

    var SKILLS = [
      'React','TypeScript','Next.js','Microfrontends',
      'Module Federation','Design Systems','Node.js','GraphQL',
      'D3.js','Playwright','Storybook','Webpack',
      'Vite','GitHub Actions','Agentic AI','LangChain',
      'WCAG 2.1','Highcharts','Docker','AWS',
      'Redux','Zustand','React Query','RAG',
      'SSR / SSG','Recharts','Monorepo','LLM Streaming'
    ];

    var N = SKILLS.length;
    /* Fibonacci sphere layout */
    var pts = SKILLS.map(function(label, i) {
      var phi   = Math.acos(1 - 2 * (i + 0.5) / N);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return { label: label, x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi) };
    });

    var rotX = 0.3, rotY = 0, velX = 0.0008, velY = 0.003;
    var dragging = false, lastDX = 0, lastDY = 0;
    var open = false, raf, autoTimer;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

    function rotate(p) {
      var cx = Math.cos(rotX), sx = Math.sin(rotX);
      var cy = Math.cos(rotY), sy = Math.sin(rotY);
      var y1 = p.y * cx - p.z * sx, z1 = p.y * sx + p.z * cx;
      return { x: p.x * cy + z1 * sy, y: y1, z: -p.x * sy + z1 * cy, label: p.label };
    }

    function project(p) {
      var W = canvas.width, H = canvas.height;
      var R = Math.min(W, H) * 0.34;
      var fov = 2.8, s = fov / (fov + p.z);
      return { px: W/2 + p.x * R * s, py: H/2 + p.y * R * s, s: s, z: p.z };
    }

    function draw() {
      if (!open) return;
      raf = requestAnimationFrame(draw);
      if (!dragging) { rotY += velY; rotX += velX; }

      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* Dark background */
      ctx.fillStyle = '#0e0c0b';
      ctx.fillRect(0, 0, W, H);

      var rotated = pts.map(rotate);

      /* Edges between nearby nodes */
      for (var a = 0; a < N; a++) {
        for (var b = a + 1; b < N; b++) {
          var pa = rotated[a], pb = rotated[b];
          var dd = (pa.x-pb.x)*(pa.x-pb.x) + (pa.y-pb.y)*(pa.y-pb.y) + (pa.z-pb.z)*(pa.z-pb.z);
          if (dd < 0.72) {
            var pa2 = project(pa), pb2 = project(pb);
            var avgDepth = (pa2.z + pb2.z) / 2;
            var alpha = (1 - Math.sqrt(dd) / 0.85) * 0.12 * ((avgDepth + 1) / 2);
            ctx.beginPath();
            ctx.moveTo(pa2.px, pa2.py); ctx.lineTo(pb2.px, pb2.py);
            ctx.strokeStyle = 'rgba(191,90,50,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      /* Nodes + labels — sorted back to front */
      var sorted = rotated.slice().sort(function(a, b) { return a.z - b.z; });
      sorted.forEach(function(p) {
        var q = project(p);
        var norm = (q.z + 1) / 2;
        var dotR = 1.5 + norm * 2.5;
        var dotA = 0.2 + norm * 0.8;
        ctx.beginPath();
        ctx.arc(q.px, q.py, dotR, 0, 6.2832);
        ctx.fillStyle = 'rgba(191,90,50,' + dotA.toFixed(2) + ')';
        ctx.fill();

        if (norm > 0.4) {
          var fs = (9 + norm * 5).toFixed(0);
          ctx.font = fs + 'px "JetBrains Mono",monospace';
          ctx.fillStyle = 'rgba(240,230,218,' + (0.15 + norm * 0.7).toFixed(2) + ')';
          ctx.textAlign = 'left';
          ctx.fillText(p.label, q.px + dotR + 4, q.py + 4);
        }
      });
    }

    function openEgg() {
      if (open) return;
      open = true; resize();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      raf = requestAnimationFrame(draw);
      autoTimer = setTimeout(closeEgg, 12000);
    }

    function closeEgg() {
      if (!open) return;
      open = false;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      /* Return focus to hero */
      var hero = document.getElementById('hero');
      if (hero) { hero.setAttribute('tabindex', '-1'); hero.focus(); }
    }

    /* Drag to rotate */
    canvas.addEventListener('mousedown', function(e) { dragging = true; lastDX = e.clientX; lastDY = e.clientY; canvas.style.cursor = 'grabbing'; });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      velY = (e.clientX - lastDX) * 0.012;
      velX = (e.clientY - lastDY) * 0.010;
      rotY += velY; rotX += velX;
      lastDX = e.clientX; lastDY = e.clientY;
    });
    document.addEventListener('mouseup', function() { dragging = false; velX = 0.0008; velY = 0.003; canvas.style.cursor = ''; });

    closeBtn.addEventListener('click', closeEgg);

    document.addEventListener('keydown', function(e) {
      var inInput = e.target && e.target.matches && e.target.matches('input,textarea,select,[contenteditable]');
      if (inInput) return;
      if (e.key === '?' && !open) { e.preventDefault(); openEgg(); }
      if (e.key === 'Escape' && open) closeEgg();
    });

    window.addEventListener('resize', function() { if (open) resize(); });
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
     RECRUITER MODE — AI summary strip + body effects
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
    /* ── DOM refs ── */
    var heroToggle    = document.getElementById('rm-hero-toggle');
    var footToggle    = document.getElementById('recruiter-toggle');
    var headerToggle  = document.getElementById('header-rm-toggle');
    var headerExitBtn = document.getElementById('header-rm-exit');
    var mobileRmBtn   = document.getElementById('mobile-rm-btn');
    var mobileRmExit  = document.getElementById('mobile-rm-exit');
    var header        = document.querySelector('header');

    /* Two-way toggles (hero + footer): turn mode on OR off */
    var twoWayToggles = [heroToggle, footToggle].filter(Boolean);
    /* All toggles for aria-pressed sync */
    var allToggles = [heroToggle, footToggle, headerToggle, mobileRmBtn].filter(Boolean);

    /* At least the header entry must exist */
    if (!headerToggle && !twoWayToggles.length) return;

    /* ── State ── */
    var on = false;
    try { on = localStorage.getItem('recruiter') === '1'; } catch(e) {}

    /* ── Sync all toggle aria-pressed to current mode ── */
    function syncToggles(active) {
      allToggles.forEach(function (t) {
        t.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    /* ── Header recruiter-active class (replaces strip) ── */
    function activateHeader() {
      if (header) header.classList.add('recruiter-active');
    }
    function deactivateHeader() {
      if (header) header.classList.remove('recruiter-active');
    }

    /* ── Core state setter ── */
    function set(active) {
      on = active;
      document.body.classList.toggle('recruiter-mode', on);
      syncToggles(on);
      /* R1: update header toggle aria-label to signal mode state */
      if (headerToggle) {
        headerToggle.setAttribute('aria-label', active
          ? 'Recruiter mode active — click to open briefing'
          : 'Open recruiter briefing: curated AI-style summary of this portfolio');
      }
      try { localStorage.setItem('recruiter', on ? '1' : '0'); } catch(e) {}
      if (on) {
        activateHeader();
      } else {
        deactivateHeader();
        /* Close panel when exiting mode */
        if (window.RecruiterBriefing && window.RecruiterBriefing.isOpen()) {
          window.RecruiterBriefing.close();
        }
      }
    }

    /* ── Lazy-load recruiter panel module ── */
    var _loadPromise = null;
    function loadRecruiterModule() {
      if (window.RecruiterBriefing) return Promise.resolve(window.RecruiterBriefing);
      if (_loadPromise) return _loadPromise;

      var cssLoaded = new Promise(function (resolve) {
        var link    = document.createElement('link');
        link.rel    = 'stylesheet';
        link.href   = '/assets/recruiter.css';
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });

      _loadPromise = cssLoaded
        .then(function () { return loadScript('/assets/recruiter-data.js'); })
        .then(function () { return loadScript('/assets/recruiter.js'); })
        .then(function () { return window.RecruiterBriefing || {}; })
        .catch(function (err) {
          console.warn('[recruiter] module load failed', err);
          return {};
        });
      return _loadPromise;
    }

    function enterAndOpen(trigger) {
      if (!on) set(true);
      loadRecruiterModule().then(function (m) {
        if (m && m.open) m.open(trigger);
      });
    }

    /* ── Restore from localStorage: mode on but do NOT auto-open panel ── */
    if (on) set(true);

    /* ── Two-way toggles (hero / footer): click toggles mode on/off ── */
    twoWayToggles.forEach(function (t) {
      t.addEventListener('click', function () {
        if (on) {
          /* Turning off: set(false) closes panel internally */
          set(false);
        } else {
          /* Turning on: enter mode and open panel */
          enterAndOpen(t);
        }
      });
    });

    /* ── Header toggle: always opens briefing (never exits mode alone) ── */
    if (headerToggle) {
      headerToggle.addEventListener('click', function () {
        enterAndOpen(headerToggle);
      });
    }

    /* ── "Exit mode" button in header ── */
    if (headerExitBtn) {
      headerExitBtn.addEventListener('click', function () {
        set(false);
      });
    }

    /* ── Mobile nav recruiter button ── */
    if (mobileRmBtn) {
      mobileRmBtn.addEventListener('click', function () {
        /* Close mobile nav first, then open briefing */
        var hamburger  = document.getElementById('hamburger');
        var mobileNav  = document.getElementById('mobile-nav');
        var navOverlay = document.getElementById('nav-overlay');
        if (mobileNav)  mobileNav.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('open');
        if (hamburger)  hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';

        enterAndOpen(mobileRmBtn);
      });
    }

    /* ── Mobile exit mode button (R2) ── */
    if (mobileRmExit) {
      mobileRmExit.addEventListener('click', function () {
        /* Close mobile nav first */
        var hamburger  = document.getElementById('hamburger');
        var mobileNav  = document.getElementById('mobile-nav');
        var navOverlay = document.getElementById('nav-overlay');
        if (mobileNav)  mobileNav.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('open');
        if (hamburger)  hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        set(false);
      });
    }

    /* ── Deep link: ?recruiter=1 → mode on + panel open ── */
    if (new URLSearchParams(location.search).get('recruiter') === '1') {
      set(true);
      loadRecruiterModule().then(function (m) {
        if (m && m.open) m.open();
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
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    /* Capture phase: fires before theme.js changes the theme */
    btn.addEventListener('click', function() {
      var html = document.documentElement;
      html.classList.add('theme-transitioning');
      setTimeout(function() { html.classList.remove('theme-transitioning'); }, 320);
    }, true);
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
          announce.textContent = 'Jumped to contact section — type your name to get in touch';
          setTimeout(function() { announce.textContent = ''; }, 3000);
        }
      }
    });
  }

}());
