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
    var btns = document.querySelectorAll('.theme-pick-btn:not(.lang-pick-btn)');
    for (var k = 0; k < btns.length; k++) {
      btns[k].setAttribute('aria-label', 'Theme: ' + label + '. Change');
    }
  }

  window.applyTheme = applyTheme;

  function initThemePicker(btn, menu) {
    if (window.DisplayMenu) {
      window.DisplayMenu.initThemeMenu(btn, menu, applyTheme);
      return;
    }
    if (!window.PrefsChrome) return;
    window.PrefsChrome.PopoverMenu(btn, menu, {
      onSelect: function (e, ctx) {
        var item = e.target.closest('.theme-menu-item[data-t]');
        if (!item) return;
        applyTheme(item.dataset.t);
        ctx.close();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.PrefsChrome && !window.DisplayMenu) {
      console.warn('[theme] PrefsChrome not loaded — theme picker disabled');
    }
    applyTheme(getStoredTheme());
    var btns = document.querySelectorAll('.theme-pick-btn:not(.lang-pick-btn)');
    for (var i = 0; i < btns.length; i++) {
      var menuId = btns[i].getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      if (menu) {
        menu.setAttribute('data-popover-fixed', btn.closest('#mobile-nav') ? 'true' : 'false');
      }
      initThemePicker(btns[i], menu);
    }
  });
})();
