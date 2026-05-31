/* === theme.js === */
(function () {
  'use strict';

  var THEMES = [
    { id: 'light', label: 'Warm paper' },
    { id: 'dark', label: 'Charcoal' },
    { id: 'sage', label: 'Sage mist' },
    { id: 'slate', label: 'Slate studio' },
    { id: 'dusk', label: 'Dusk editorial' },
    { id: 'high-contrast', label: 'High contrast' }
  ];

  function isValidTheme(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return true;
    }
    return false;
  }

  function getStoredTheme() {
    try {
      var t = localStorage.getItem('theme');
      return isValidTheme(t) ? t : 'high-contrast';
    } catch (e) { return 'high-contrast'; }
  }

  function applyTheme(id) {
    if (!isValidTheme(id)) id = 'high-contrast';

    document.documentElement.dataset.theme = id;
    try { localStorage.setItem('theme', id); } catch (e) {}

    if (window.ThemeBridge) window.ThemeBridge.onPortfolioThemeChange(id);

    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: id } }));

    requestAnimationFrame(function () {
      var metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        var v = getComputedStyle(document.documentElement)
          .getPropertyValue('--theme-color-val').trim();
        if (v) metaTheme.content = v;
      }
    });

    var items = document.querySelectorAll('.theme-menu-item[data-t]');
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute('aria-selected', items[i].dataset.t === id ? 'true' : 'false');
    }

    var label = 'High contrast';
    for (var j = 0; j < THEMES.length; j++) {
      if (THEMES[j].id === id) { label = THEMES[j].label; break; }
    }
    document.querySelectorAll('.theme-pick-btn').forEach(function (btn) {
      if (btn.classList.contains('lang-pick-btn')) return;
      btn.setAttribute('aria-label', 'Theme: ' + label + '. Change');
    });
  }

  window.applyTheme = applyTheme;

  function initThemePicker(btn, menu) {
    if (!btn || !menu || !window.PrefsChrome) return;
    menu.setAttribute('data-popover-fixed', btn.closest('#mobile-nav') ? 'true' : 'false');
    window.PrefsChrome.PopoverMenu(btn, menu, {
      onSelect: function (e, ctx) {
        var item = e.target.closest('.theme-menu-item[data-t]');
        if (!item) return;
        applyTheme(item.dataset.t);
        ctx.close();
      },
      onActivate: function (e, ctx) {
        var active = document.activeElement;
        if (active && active.classList && active.classList.contains('theme-menu-item') && active.dataset.t) {
          applyTheme(active.dataset.t);
          ctx.close();
        }
      }
    });
  }

  function bootThemePickers() {
    if (!window.PrefsChrome) {
      console.warn('[theme] PrefsChrome not loaded — theme picker disabled');
      return;
    }
    applyTheme(getStoredTheme());
    document.querySelectorAll('.theme-pick-btn').forEach(function (btn) {
      if (btn.classList.contains('lang-pick-btn')) return;
      if (btn.id === 'casebook-prefs-btn') return;
      var menuId = btn.getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      initThemePicker(btn, menu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootThemePickers);
  } else {
    bootThemePickers();
  }
})();
