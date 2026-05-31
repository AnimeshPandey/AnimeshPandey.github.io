/**
 * theme-bridge.js — sync portfolio localStorage.theme ↔ casebook appearance.
 */
(function (global) {
  'use strict';

  var MAP = {
    'high-contrast': { color: 'dark', contrast: 'high' },
    dark: { color: 'dark', contrast: 'normal' },
    slate: { color: 'dark', contrast: 'normal' },
    dusk: { color: 'dark', contrast: 'normal' },
    light: { color: 'light', contrast: 'normal' },
    sage: { color: 'light', contrast: 'normal' }
  };

  function getPortfolioTheme() {
    try {
      var t = localStorage.getItem('theme');
      return MAP[t] ? t : 'high-contrast';
    } catch (e) {
      return 'high-contrast';
    }
  }

  function toCasebook(themeId) {
    return MAP[themeId] || MAP['high-contrast'];
  }

  function applyCasebookFromPortfolio(themeId) {
    var m = toCasebook(themeId);
    var root = document.documentElement;
    root.dataset.casebookColor = m.color;
    root.dataset.casebookContrast = m.contrast;
    try {
      localStorage.setItem('casebook-color-mode', m.color === 'dark' ? 'dark' : 'light');
      localStorage.setItem('casebook-contrast', m.contrast);
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('casebook-color-change', {
      detail: { mode: m.color, resolved: m.color, fromBridge: true },
      bubbles: true
    }));
  }

  function applyPortfolioFromCasebook(color, contrast) {
    var themeId = 'high-contrast';
    if (contrast === 'high') themeId = 'high-contrast';
    else if (color === 'dark') themeId = 'dark';
    else themeId = 'light';
    try { localStorage.setItem('theme', themeId); } catch (e) {}
    document.documentElement.dataset.theme = themeId;
    if (global.applyTheme) global.applyTheme(themeId);
  }

  function onPortfolioThemeChange(themeId) {
    applyCasebookFromPortfolio(themeId);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.dataset.casebookColor !== undefined) {
      applyCasebookFromPortfolio(getPortfolioTheme());
    }
  });

  global.ThemeBridge = {
    getPortfolioTheme: getPortfolioTheme,
    toCasebook: toCasebook,
    applyCasebookFromPortfolio: applyCasebookFromPortfolio,
    applyPortfolioFromCasebook: applyPortfolioFromCasebook,
    onPortfolioThemeChange: onPortfolioThemeChange,
    MAP: MAP
  };
})(typeof window !== 'undefined' ? window : this);
