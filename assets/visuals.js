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
    initSkillsToggle();
    initCardExpand();
    initMobileEgg();
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
     SKILLS TOGGLE — List / Visual switcher
     ══════════════════════════════════════════════════ */
  function initSkillsToggle() {
    var btns    = document.querySelectorAll('.stgl');
    var listEl  = document.getElementById('skills-list');
    var visualEl = document.getElementById('skills-visual');
    if (!btns.length || !listEl || !visualEl) return;

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.dataset.view;
        btns.forEach(function (b) {
          b.classList.toggle('stgl-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        if (view === 'visual') {
          listEl.hidden = true;
          visualEl.hidden = false;
          visualEl.removeAttribute('aria-hidden');
        } else {
          visualEl.hidden = true;
          visualEl.setAttribute('aria-hidden', 'true');
          listEl.hidden = false;
        }
      });
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

}());
