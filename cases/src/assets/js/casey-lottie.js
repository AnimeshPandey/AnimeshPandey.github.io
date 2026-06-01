/**
 * casey-lottie.js — lazy Lottie idle loops on hub (desktop only, PRM + intensity safe).
 */
(function initCaseyLottie() {
  'use strict';

  function dotLottieEnabled() {
    try {
      if (document.documentElement.dataset.caseyDotlottie === '1') return true;
      return new URLSearchParams(window.location.search).get('caseyDotlottie') === '1';
    } catch (e) {
      return false;
    }
  }

  function lottieAllowed() {
    if (dotLottieEnabled()) return false; /* DotLottie spike uses separate player when enabled */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(max-width: 767px)').matches) return false;
    if (window.CaseyCompanion && window.CaseyCompanion.shouldShowCaseyBehavior) {
      return window.CaseyCompanion.shouldShowCaseyBehavior('lottie');
    }
    return true;
  }

  if (!lottieAllowed()) return;

  var assetBase = (document.documentElement.dataset.assetBase || '/cases/assets/casey/').replace(
    /\/?$/,
    '/'
  );
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
  var loaded = false;
  var instances = [];

  function readTier() {
    try {
      var t = localStorage.getItem('casebook-tone');
      if (['junior', 'mid', 'staff'].indexOf(t) !== -1) return t;
    } catch (e) { /* ignore */ }
    return 'junior';
  }

  function destroyAll() {
    instances.forEach(function (inst) {
      try {
        inst.destroy();
      } catch (e) { /* ignore */ }
    });
    instances = [];
    document.querySelectorAll('.casey-lottie-host').forEach(function (el) {
      el.innerHTML = '';
      el.hidden = true;
    });
    document.querySelectorAll('.casey-hub__avatar-frame').forEach(function (frame) {
      frame.style.visibility = '';
    });
  }

  function mountForHost(host) {
    if (!window.lottie || !host) return;
    if (!host.classList.contains('casey-lottie-host--hub')) return;
    var tier = host.dataset.caseyLottieTier || readTier();
    var path = assetBase + 'lottie/' + tier + '/idle.json';
    host.hidden = false;
    host.innerHTML = '';
    var anim = window.lottie.loadAnimation({
      container: host,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: path,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    instances.push(anim);
    var wrap = host.closest('.casey-hub__avatar-wrap');
    var frame = wrap && wrap.querySelector('.casey-hub__avatar-frame');
    if (frame) frame.style.visibility = 'hidden';
    var fallback = wrap && wrap.querySelector('[data-casey-lottie-fallback]');
    if (fallback) fallback.setAttribute('aria-hidden', 'true');
  }

  function mountAll() {
    if (!lottieAllowed()) {
      destroyAll();
      return;
    }
    document.querySelectorAll('.casey-lottie-host--hub').forEach(mountForHost);
  }

  function ensureLottie(cb) {
    if (window.lottie) {
      cb();
      return;
    }
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.src = CDN;
    s.async = true;
    s.onload = function () {
      cb();
    };
    s.onerror = function () {
      loaded = false;
    };
    document.head.appendChild(s);
  }

  function init() {
    var hosts = document.querySelectorAll('.casey-lottie-host--hub');
    if (!hosts.length || !lottieAllowed()) return;
    ensureLottie(mountAll);
  }

  document.addEventListener('casebook-tone-change', function (e) {
    var tier = e.detail && e.detail.tone;
    if (!tier) return;
    destroyAll();
    document.querySelectorAll('.casey-lottie-host--hub').forEach(function (host) {
      host.dataset.caseyLottieTier = tier;
    });
    if (lottieAllowed()) ensureLottie(mountAll);
  });

  document.addEventListener('casey-companion-event', function (e) {
    if (e.detail && e.detail.type === 'casey-intensity-change') {
      destroyAll();
      if (lottieAllowed()) ensureLottie(mountAll);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CaseyLottie = { destroy: destroyAll, remount: function () { destroyAll(); ensureLottie(mountAll); } };
}());
