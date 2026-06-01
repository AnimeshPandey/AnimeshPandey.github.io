/**
 * casey-lottie.js — lazy Lottie idle loops per tier (PRM-safe).
 */
(function initCaseyLottie() {
  'use strict';

  var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prm) return;

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
    document.querySelectorAll('[data-casey-lottie-fallback]').forEach(function (img) {
      img.hidden = false;
    });
  }

  function mountForHost(host) {
    if (!window.lottie || !host) return;
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
    var fallback = host.parentElement && host.parentElement.querySelector('[data-casey-lottie-fallback]');
    if (fallback) fallback.hidden = true;
  }

  function mountAll() {
    document.querySelectorAll('.casey-lottie-host').forEach(mountForHost);
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
    var hosts = document.querySelectorAll('.casey-lottie-host');
    if (!hosts.length) return;
    ensureLottie(mountAll);
  }

  document.addEventListener('casebook-tone-change', function (e) {
    var tier = e.detail && e.detail.tone;
    if (!tier) return;
    destroyAll();
    document.querySelectorAll('.casey-lottie-host').forEach(function (host) {
      host.dataset.caseyLottieTier = tier;
    });
    ensureLottie(mountAll);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CaseyLottie = { destroy: destroyAll, remount: function () { destroyAll(); ensureLottie(mountAll); } };
}());
