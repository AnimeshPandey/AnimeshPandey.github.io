/* eggs-tablet.js — Tablet-tier Easter eggs
   T2: Tap #skills-heading → Canvas 2D skill orbit overlay
       Single-finger drag to spin nodes; Escape / close button exits.
   Loaded lazily by visuals.js only on tablet tier. */
(function () {
  'use strict';

  var data = window.__EGG_DATA || {};

  /* ── Close registry ── */
  var _closers = [];
  function registerClose(fn) { _closers.push(fn); }

  /* ══════════════════════════════════════════════════
     T2 — Skill orbit overlay
     ══════════════════════════════════════════════════ */
  function initT2(caps) {
    var heading = document.getElementById('skills-heading');
    if (!heading) return;

    var nodes   = data.orbitNodes || [];
    var N       = nodes.length;
    if (!N || !caps.canvas2d) return;

    /* ── Hint (once per session) ── */
    var hintShown = false;
    try { hintShown = sessionStorage.getItem('egg_hint_orbit') === '1'; } catch (e) {}
    if (!hintShown) {
      var cue = document.createElement('span');
      cue.className = 'egg-orbit-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.textContent = '✦  Tap heading for skill orbit';
      heading.parentNode.insertBefore(cue, heading.nextSibling);
      setTimeout(function () { cue.classList.add('visible'); }, 1800);
      setTimeout(function () {
        cue.classList.remove('visible');
        try { sessionStorage.setItem('egg_hint_orbit', '1'); } catch (e) {}
      }, 8000);
    }

    /* ── Build overlay ── */
    var overlay = document.createElement('div');
    overlay.id = 'egg-orbit-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Skills orbit');
    overlay.setAttribute('tabindex', '-1');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="egg-orbit-ui">' +
        '<p class="egg-orbit-title">// skill orbit</p>' +
        '<p class="egg-orbit-hint">drag to spin · tap to close</p>' +
        '<button class="egg-orbit-close" aria-label="Close skill orbit">✕ close</button>' +
      '</div>' +
      '<canvas id="egg-orbit-canvas" aria-hidden="true"></canvas>';
    document.body.appendChild(overlay);

    var canvas  = document.getElementById('egg-orbit-canvas');
    var ctx     = canvas.getContext('2d');
    var closeBtn = overlay.querySelector('.egg-orbit-close');

    /* ── Reduced motion: static tag cloud instead of canvas ── */
    if (caps.reducedMotion) {
      /* Show static word cloud in overlay, no rAF */
      var staticEl = document.createElement('div');
      staticEl.className = 'egg-orbit-static';
      nodes.forEach(function (n) {
        var tag = document.createElement('span');
        tag.style.cssText =
          'font-family:var(--mono);font-size:13px;letter-spacing:.06em;' +
          'color:' + n.color + ';padding:4px 10px;border:1px solid ' + n.color + '33;' +
          'border-radius:6px;';
        tag.textContent = n.label;
        staticEl.appendChild(tag);
      });
      overlay.appendChild(staticEl);

      /* Wire open/close for reduced-motion path */
      var rmOpen = false;
      function openRM() {
        if (rmOpen) return;
        rmOpen = true;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
      }
      function closeRM() {
        if (!rmOpen) return;
        rmOpen = false;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        heading.focus();
      }
      registerClose(closeRM);
      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.addEventListener('click', openRM);
      heading.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rmOpen ? closeRM() : openRM(); }
      });
      closeBtn.addEventListener('click', closeRM);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && rmOpen) closeRM(); });
      return; /* static path done */
    }

    /* ── Canvas / animation state ── */
    var angleStep = (2 * Math.PI) / N;
    var angle = 0;          /* current rotation offset */
    var vel   = 0.0012;     /* auto-spin velocity */
    var open  = false;
    var raf   = null;

    /* Drag state */
    var dragging = false, lastTX = 0;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw() {
      if (!open) return;
      raf = requestAnimationFrame(draw);

      if (!dragging) angle += vel;

      var W  = canvas.width, H = canvas.height;
      var cx = W / 2, cy = H / 2;
      var R  = Math.min(W, H) * 0.32;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0908';
      ctx.fillRect(0, 0, W, H);

      /* Draw edges between adjacent nodes */
      nodes.forEach(function (n, i) {
        var a1 = angle + i * angleStep;
        var a2 = angle + ((i + 1) % N) * angleStep;
        var x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
        var x2 = cx + Math.cos(a2) * R, y2 = cy + Math.sin(a2) * R;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255,255,255,.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      /* Draw spokes */
      nodes.forEach(function (n, i) {
        var a = angle + i * angleStep;
        var nx = cx + Math.cos(a) * R, ny = cy + Math.sin(a) * R;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = 'rgba(255,255,255,.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      /* Draw hub */
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, 6.2832);
      ctx.fillStyle = 'rgba(191,90,50,.6)';
      ctx.fill();

      /* Draw nodes + labels */
      nodes.forEach(function (n, i) {
        var a  = angle + i * angleStep;
        var nx = cx + Math.cos(a) * R;
        var ny = cy + Math.sin(a) * R;

        /* Node circle */
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, 6.2832);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;

        /* Label */
        ctx.font = '11px "JetBrains Mono",monospace';
        ctx.fillStyle = 'rgba(250,248,244,.9)';
        ctx.textAlign  = nx > cx ? 'left' : 'right';
        var lx = nx > cx ? nx + 13 : nx - 13;
        ctx.fillText(n.label, lx, ny + 4);
      });
    }

    function openOverlay() {
      if (open) return;
      open = true;
      resize();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      draw();
    }

    function closeOverlay() {
      if (!open) return;
      open = false;
      cancelAnimationFrame(raf);
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      heading.focus();
    }

    registerClose(closeOverlay);

    /* Touch drag-to-spin */
    canvas.addEventListener('touchstart', function (e) {
      dragging = true;
      lastTX = e.touches[0].clientX;
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var dx = e.touches[0].clientX - lastTX;
      angle += dx * 0.006;
      lastTX = e.touches[0].clientX;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', function () {
      dragging = false;
    }, { passive: true });

    /* Heading trigger */
    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    heading.addEventListener('click', openOverlay);
    heading.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open ? closeOverlay() : openOverlay(); }
    });

    closeBtn.addEventListener('click', closeOverlay);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) closeOverlay();
    });

    window.addEventListener('resize', function () { if (open) resize(); });

    /* Pause when tab hidden */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && open) draw();
    });
  }

  /* ══════════════════════════════════════════════════
     Public API
     ══════════════════════════════════════════════════ */
  window.Eggs = {
    boot: function (tier, caps) {
      if (tier !== 'tablet') return;
      initT2(caps);
    },
    closeAll: function () {
      _closers.forEach(function (fn) { try { fn(); } catch (e) {} });
    }
  };

}());
