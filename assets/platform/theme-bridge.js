/**
 * theme-bridge.js — optional first-visit hint from portfolio theme (Casebook only).
 * Does not load theme.js or sync ongoing portfolio theme changes.
 */
(function (global) {
  'use strict';

  var COLOR_KEY = 'casebook-color-mode';

  var DARK_FAMILY = { dark: 1, slate: 1, dusk: 1, 'high-contrast': 1 };

  /** Seed casebook-color-mode once when unset (FOUC may already have set data-casebook-color). */
  function seedCasebookColorFromPortfolioIfNeeded() {
    var existing;
    try { existing = localStorage.getItem(COLOR_KEY); } catch (e) {}
    if (existing) return;

    var portfolioTheme = 'high-contrast';
    try { portfolioTheme = localStorage.getItem('theme') || 'high-contrast'; } catch (e) {}

    if (!DARK_FAMILY[portfolioTheme]) return;

    try { localStorage.setItem(COLOR_KEY, 'dark'); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.dataset.casebookColor === undefined) return;
    seedCasebookColorFromPortfolioIfNeeded();
  });

  global.ThemeBridge = {
    seedCasebookColorFromPortfolioIfNeeded: seedCasebookColorFromPortfolioIfNeeded
  };
})(typeof window !== 'undefined' ? window : this);
