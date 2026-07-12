/* eggs-mobile.js — Mobile-tier Easter eggs
   M1: Tap hero badge → career snapshot slide-up card
   M2: Long-press .stat-n → sparkline popup
   Loaded lazily by visuals.js only on mobile tier. */
(function () {
  'use strict';

  var data = window.__EGG_DATA || {};

  /* ── Shared close registry (for Eggs.closeAll) ── */
  var _closers = [];
  function registerClose(fn) { _closers.push(fn); }

  /* ══════════════════════════════════════════════════
     M1 — Career snapshot slide-up card
     (migrated from initMobileEgg in visuals.js)
     ══════════════════════════════════════════════════ */
  function initM1(caps) {
    var badge = document.querySelector('#hero .badge');
    if (!badge) return;

    /* Hint — shown once per session */
    var hintShown = false;
    try { hintShown = sessionStorage.getItem('egg_hint_career') === '1'; } catch (e) {}

    /* Derive the accessible name from the badge's own (possibly localized)
       visible text so it always contains that text verbatim — avoids
       label/content mismatches (e.g. "&" vs "and") across locales. */
    var badgeText = (badge.textContent || '').replace(/\s+/g, ' ').trim();
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('aria-label', badgeText + ' - tap for career snapshot');
    badge.style.cursor = 'pointer';

    if (!hintShown) {
      var hint = document.createElement('p');
      hint.className = 'egg-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.textContent = '✦  Tap badge for career snapshot';
      badge.parentNode.insertBefore(hint, badge.nextSibling);
      setTimeout(function () { hint.classList.add('visible'); }, 1500);
      setTimeout(function () {
        hint.classList.remove('visible');
        try { sessionStorage.setItem('egg_hint_career', '1'); } catch (e) {}
      }, 7000);
    }

    /* Build card */
    var rows = (data.snapshot || []).map(function (r) {
      return '<div class="egg-row"><span class="egg-n">' + r.n + '</span><span class="egg-l">' + r.l + '</span></div>';
    }).join('');

    var card = document.createElement('div');
    card.className = 'egg-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-label', 'Career snapshot');
    card.innerHTML =
      '<div class="egg-card-inner">' +
        '<p class="egg-card-label">// career snapshot</p>' +
        '<div class="egg-rows">' + rows + '</div>' +
        '<p class="egg-note">' + (data.snapshotNote || '') + '</p>' +
        '<button class="egg-close" aria-label="Close career snapshot">✕ close</button>' +
      '</div>';
    document.body.appendChild(card);

    var open = false, timer;

    function openCard() {
      if (open) return;
      open = true;
      card.classList.add('open');
      card.querySelector('.egg-close').focus();
      timer = setTimeout(closeCard, 6000);
    }

    function closeCard() {
      if (!open) return;
      open = false;
      clearTimeout(timer);
      card.classList.remove('open');
      badge.focus();
    }

    registerClose(closeCard);

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
     M2 — Long-press stat sparkline popup
     ══════════════════════════════════════════════════ */
  function initM2(caps) {
    if (!caps.canvas2d) return;

    var sparkData = data.sparklines || {};
    var statEls = document.querySelectorAll('.stat-n');
    if (!statEls.length) return;

    /* Hint — shown once per session on first stat element */
    var hintShown = false;
    try { hintShown = sessionStorage.getItem('egg_hint_sparkline') === '1'; } catch (e) {}
    if (!hintShown && statEls[0]) {
      var hintEl = document.createElement('p');
      hintEl.className = 'egg-hint';
      hintEl.setAttribute('aria-hidden', 'true');
      hintEl.textContent = '✦  Hold stat for trend';
      statEls[0].parentNode.insertBefore(hintEl, statEls[0].nextSibling);
      setTimeout(function () { hintEl.classList.add('visible'); }, 2200);
      setTimeout(function () {
        hintEl.classList.remove('visible');
        try { sessionStorage.setItem('egg_hint_sparkline', '1'); } catch (e) {}
      }, 8000);
    }

    /* Build shared popup */
    var popup = document.createElement('div');
    popup.className = 'egg-sparkline-popup';
    popup.setAttribute('aria-hidden', 'true');
    popup.innerHTML =
      '<p class="egg-spark-label" id="egg-spark-label-txt"></p>' +
      '<canvas class="egg-spark-canvas" width="120" height="44" aria-hidden="true"></canvas>' +
      '<p class="egg-spark-caption" id="egg-spark-cap-txt"></p>';
    document.body.appendChild(popup);

    var popupCanvas = popup.querySelector('.egg-spark-canvas');
    var popupCtx = popupCanvas.getContext('2d');
    var popupLabel = popup.querySelector('#egg-spark-label-txt');
    var popupCaption = popup.querySelector('#egg-spark-cap-txt');

    var _pressTimer = null;
    var _activeEl = null;

    function drawSparkline(points, isDark) {
      var W = popupCanvas.width, H = popupCanvas.height;
      var pad = 4;
      var min = Math.min.apply(null, points);
      var max = Math.max.apply(null, points);
      var range = max - min || 1;
      popupCtx.clearRect(0, 0, W, H);

      var step = (W - pad * 2) / (points.length - 1);
      var toX = function (i) { return pad + i * step; };
      var toY = function (v) { return H - pad - ((v - min) / range) * (H - pad * 2); };

      /* Fill gradient */
      var grad = popupCtx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, isDark ? 'rgba(191,90,50,.35)' : 'rgba(191,90,50,.25)');
      grad.addColorStop(1, 'rgba(191,90,50,0)');
      popupCtx.beginPath();
      popupCtx.moveTo(toX(0), toY(points[0]));
      for (var i = 1; i < points.length; i++) popupCtx.lineTo(toX(i), toY(points[i]));
      popupCtx.lineTo(toX(points.length - 1), H);
      popupCtx.lineTo(toX(0), H);
      popupCtx.closePath();
      popupCtx.fillStyle = grad;
      popupCtx.fill();

      /* Line */
      popupCtx.beginPath();
      popupCtx.moveTo(toX(0), toY(points[0]));
      for (var j = 1; j < points.length; j++) popupCtx.lineTo(toX(j), toY(points[j]));
      popupCtx.strokeStyle = isDark ? 'rgba(191,90,50,.9)' : 'rgba(150,65,30,.9)';
      popupCtx.lineWidth = 1.5;
      popupCtx.stroke();

      /* End dot */
      popupCtx.beginPath();
      popupCtx.arc(toX(points.length - 1), toY(points[points.length - 1]), 3, 0, 6.2832);
      popupCtx.fillStyle = isDark ? '#BF5A32' : '#9a4020';
      popupCtx.fill();
    }

    function showPopup(el, key, sData) {
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + window.scrollY;

      popupLabel.textContent = sData.label;
      popupCaption.textContent = sData.caption;

      var isDark = document.documentElement.dataset.theme === 'dark';
      drawSparkline(sData.points, isDark);

      popup.style.left = cx + 'px';
      popup.style.top  = cy + 'px';
      popup.classList.add('egg-sparkline-in');
    }

    function hidePopup() {
      popup.classList.remove('egg-sparkline-in');
    }

    statEls.forEach(function (el) {
      var key  = (el.textContent || '').trim();
      var sData = sparkData[key];
      if (!sData) return;

      /* Long-press detection */
      el.addEventListener('touchstart', function (e) {
        _activeEl = el;
        _pressTimer = setTimeout(function () {
          showPopup(el, key, sData);
        }, 500);
      }, { passive: true });

      el.addEventListener('touchend', function () {
        clearTimeout(_pressTimer);
        _pressTimer = null;
        if (_activeEl === el) { hidePopup(); _activeEl = null; }
      }, { passive: true });

      el.addEventListener('touchmove', function () {
        clearTimeout(_pressTimer);
        _pressTimer = null;
      }, { passive: true });

      /* Keyboard: focus → press Space to show */
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (popup.classList.contains('egg-sparkline-in')) { hidePopup(); return; }
          showPopup(el, key, sData);
          /* Auto-hide after 3s */
          setTimeout(hidePopup, 3000);
        }
        if (e.key === 'Escape') hidePopup();
      });
    });

    registerClose(hidePopup);
  }

  /* ══════════════════════════════════════════════════
     Public API
     ══════════════════════════════════════════════════ */
  window.Eggs = {
    boot: function (tier, caps) {
      if (tier !== 'mobile') return;
      initM1(caps);
      if (!caps.reducedMotion) initM2(caps);
    },
    closeAll: function () {
      _closers.forEach(function (fn) { try { fn(); } catch (e) {} });
    }
  };

}());
