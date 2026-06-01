/**
 * casebook-preferences.js — casebook-specific preferences only.
 *
 * Theme + language menu binding is now handled by prefs-chrome.js
 * autoBootMenus(), which auto-discovers all .theme-pick-btn and .lang-pick-btn
 * elements with lazy callbacks. Nothing to do here for pickers.
 *
 * This file handles the casebook-specific motion preference class only.
 */
(function () {
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyPRM() {
    document.documentElement.classList.toggle('casebook--reduce-motion', mqMotion.matches);
  }
  applyPRM();
  mqMotion.addEventListener('change', applyPRM);
}());
