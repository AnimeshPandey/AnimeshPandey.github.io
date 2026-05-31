/* eggs-desktop.js — Desktop-tier Easter eggs
   D1: Press ? → fullscreen Canvas 2D skills constellation (migrated from visuals.js)
   D2: Type "npm test" (outside inputs) → faux terminal slide-up
   Loaded lazily by visuals.js only on desktop tier. */
(function () {
  'use strict';

  var data = window.__EGG_DATA || {};

  /* ── Close registry ── */
  var _closers = [];
  function registerClose(fn) { _closers.push(fn); }

  /* ══════════════════════════════════════════════════
     D1 — Skills constellation (migrated from initDesktopEgg)
     ══════════════════════════════════════════════════ */
  function initD1(caps) {
    if (!caps.canvas2d) return;

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
    var pts = SKILLS.map(function (label, i) {
      var phi   = Math.acos(1 - 2 * (i + 0.5) / N);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return {
        label: label,
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi)
      };
    });

    /* Overlay */
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

    var canvas  = document.getElementById('egg-desktop-canvas');
    var ctx     = canvas.getContext('2d');
    var closeBtn = overlay.querySelector('.egg-desktop-close');

    var rotX = 0.3, rotY = 0, velX = 0.0008, velY = 0.003;
    var dragging = false, lastDX = 0, lastDY = 0;
    var open = false, raf = null, autoTimer = null;

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
      return { px: W / 2 + p.x * R * s, py: H / 2 + p.y * R * s, s: s, z: p.z };
    }

    function draw() {
      if (!open) return;
      raf = requestAnimationFrame(draw);
      if (!dragging) { rotY += velY; rotX += velX; }

      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0e0c0b';
      ctx.fillRect(0, 0, W, H);

      var rotated = pts.map(rotate);

      /* Edges */
      for (var a = 0; a < N; a++) {
        for (var b = a + 1; b < N; b++) {
          var pa = rotated[a], pb = rotated[b];
          var dd = (pa.x - pb.x) * (pa.x - pb.x) + (pa.y - pb.y) * (pa.y - pb.y) + (pa.z - pb.z) * (pa.z - pb.z);
          if (dd < 0.72) {
            var pa2 = project(pa), pb2 = project(pb);
            var avgD = (pa2.z + pb2.z) / 2;
            var alpha = (1 - Math.sqrt(dd) / 0.85) * 0.12 * ((avgD + 1) / 2);
            ctx.beginPath();
            ctx.moveTo(pa2.px, pa2.py); ctx.lineTo(pb2.px, pb2.py);
            ctx.strokeStyle = 'rgba(191,90,50,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      /* Nodes + labels — back to front */
      var sorted = rotated.slice().sort(function (a, b) { return a.z - b.z; });
      sorted.forEach(function (p) {
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

    function openD1() {
      if (open) return;
      open = true;
      resize();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      raf = requestAnimationFrame(draw);
      autoTimer = setTimeout(closeD1, 12000);
    }

    function closeD1() {
      if (!open) return;
      open = false;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      var hero = document.getElementById('hero');
      if (hero) { hero.setAttribute('tabindex', '-1'); hero.focus(); }
    }

    registerClose(closeD1);

    /* Mouse drag */
    canvas.addEventListener('mousedown', function (e) {
      dragging = true; lastDX = e.clientX; lastDY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      velY = (e.clientX - lastDX) * 0.012;
      velX = (e.clientY - lastDY) * 0.010;
      rotY += velY; rotX += velX;
      lastDX = e.clientX; lastDY = e.clientY;
    });
    document.addEventListener('mouseup', function () {
      dragging = false; velX = 0.0008; velY = 0.003; canvas.style.cursor = '';
    });

    closeBtn.addEventListener('click', closeD1);

    document.addEventListener('keydown', function (e) {
      var inInput = e.target && e.target.matches && e.target.matches('input,textarea,select,[contenteditable]');
      if (inInput) return;
      if (e.key === '?' && !open) { e.preventDefault(); openD1(); }
      if (e.key === 'Escape' && open) closeD1();
    });

    window.addEventListener('resize', function () { if (open) resize(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && open) draw();
    });
  }

  /* ══════════════════════════════════════════════════
     D2 — Faux terminal ("npm test" → passing tests)
     ══════════════════════════════════════════════════ */
  function initD2(caps) {
    var lines = data.terminalLines || [];
    if (!lines.length) return;

    /* Hint — shown once per session */
    var hintShown = false;
    try { hintShown = sessionStorage.getItem('egg_hint_terminal') === '1'; } catch (e) {}

    /* Build terminal */
    var term = document.createElement('div');
    term.id = 'egg-terminal';
    term.setAttribute('role', 'dialog');
    term.setAttribute('aria-modal', 'false');
    term.setAttribute('aria-label', 'Test run output');
    term.setAttribute('aria-hidden', 'true');
    term.innerHTML =
      '<div class="egg-tm-bar">' +
        '<div class="egg-tm-dots">' +
          '<span class="egg-tm-dot egg-tm-dot-r" aria-hidden="true"></span>' +
          '<span class="egg-tm-dot egg-tm-dot-y" aria-hidden="true"></span>' +
          '<span class="egg-tm-dot egg-tm-dot-g" aria-hidden="true"></span>' +
        '</div>' +
        '<span class="egg-tm-title">npm test</span>' +
        '<button class="egg-tm-close-btn" aria-label="Close terminal">✕</button>' +
      '</div>' +
      '<div class="egg-tm-body" id="egg-tm-body" aria-live="polite"></div>';
    document.body.appendChild(term);

    var tmBody    = document.getElementById('egg-tm-body');
    var tmClose   = term.querySelector('.egg-tm-close-btn');
    var tmOpen    = false;
    var tmTimers  = [];

    function clearTimers() { tmTimers.forEach(clearTimeout); tmTimers = []; }

    function openTerminal() {
      if (tmOpen) return;
      tmOpen = true;
      tmBody.innerHTML = '';
      clearTimers();
      term.setAttribute('aria-hidden', 'false');
      term.classList.add('egg-tm-open');
      tmClose.focus();

      /* Show hint hint once */
      if (!hintShown) {
        try { sessionStorage.setItem('egg_hint_terminal', '1'); } catch (e) {}
        hintShown = true;
      }

      /* Schedule lines (skip on reduced motion — show all at once) */
      if (caps.reducedMotion) {
        lines.forEach(function (l) { appendLine(l); });
      } else {
        lines.forEach(function (l) {
          tmTimers.push(setTimeout(function () { appendLine(l); }, l.delay));
        });
        /* Auto-close 4s after last line */
        var maxDelay = lines.reduce(function (m, l) { return Math.max(m, l.delay); }, 0);
        tmTimers.push(setTimeout(closeTerminal, maxDelay + 4000));
      }
    }

    function appendLine(l) {
      var span = document.createElement('span');
      span.className = 'egg-tm-line ' + (l.cls || '');
      span.textContent = l.text;
      tmBody.appendChild(span);
    }

    function closeTerminal() {
      if (!tmOpen) return;
      tmOpen = false;
      clearTimers();
      term.classList.remove('egg-tm-open');
      term.setAttribute('aria-hidden', 'true');
    }

    registerClose(closeTerminal);

    tmClose.addEventListener('click', closeTerminal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tmOpen) closeTerminal();
    });

    /* Hint on the page — shown to desktop visitors once */
    if (!hintShown) {
      var hintEl = document.querySelector('.egg-key-hint');
      /* Inject the "npm test" hint as a second line if the element exists */
      if (hintEl) {
        var npmHint = document.createElement('p');
        npmHint.className = 'egg-hint';
        npmHint.setAttribute('aria-hidden', 'true');
        npmHint.textContent = '✦  type npm test';
        hintEl.parentNode.insertBefore(npmHint, hintEl.nextSibling);
        setTimeout(function () { npmHint.classList.add('visible'); }, 9000);
        setTimeout(function () { npmHint.classList.remove('visible'); }, 16000);
      }
    }

    /* Buffer to detect "npm test" typed outside inputs */
    var buf = '', bufTimer;
    var TARGET = 'npm test';

    document.addEventListener('keydown', function (e) {
      var inInput = e.target && e.target.matches && e.target.matches('input,textarea,select,[contenteditable]');
      if (inInput) { buf = ''; return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1 && e.key !== ' ') return;
      clearTimeout(bufTimer);
      buf += e.key;
      if (buf.length > TARGET.length) buf = buf.slice(-TARGET.length);
      bufTimer = setTimeout(function () { buf = ''; }, 3000);
      if (buf === TARGET) {
        buf = '';
        openTerminal();
      }
    });
  }

  /* ══════════════════════════════════════════════════
     Public API
     ══════════════════════════════════════════════════ */
  window.Eggs = {
    boot: function (tier, caps) {
      if (tier !== 'desktop') return;
      initD1(caps);
      if (!caps.reducedMotion) initD2(caps);
    },
    closeAll: function () {
      _closers.forEach(function (fn) { try { fn(); } catch (e) {} });
    }
  };

}());
