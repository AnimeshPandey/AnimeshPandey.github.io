/* === theme.js ===
 * Owns theme application only. Menu binding is handled by prefs-chrome.js
 * autoBootMenus(), which uses a lazy reference to window.applyTheme.
 */
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

  var DARK_THEMES = { dark: 1, slate: 1, dusk: 1, 'high-contrast': 1 };

  function applyTheme(id) {
    if (!isValidTheme(id)) id = 'high-contrast';

    document.documentElement.dataset.theme = id;
    try { localStorage.setItem('theme', id); } catch (e) {}

    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: id } }));

    requestAnimationFrame(function () {
      /* H45 — sync theme-color meta */
      var metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        var v = getComputedStyle(document.documentElement)
          .getPropertyValue('--theme-color-val').trim();
        if (v) metaTheme.content = v;
      }
      /* H45 — sync color-scheme meta */
      var metaCS = document.querySelector('meta[name="color-scheme"]');
      if (metaCS) metaCS.content = DARK_THEMES[id] ? 'dark' : 'light';
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

    /* F37 — announce theme change to screen readers */
    var announceEl = document.getElementById('shortcut-announce');
    if (announceEl) {
      announceEl.textContent = 'Theme changed to ' + label;
      setTimeout(function () {
        if (announceEl.textContent.indexOf('Theme') === 0) announceEl.textContent = '';
      }, 2500);
    }
  }

  // Expose globally so prefs-chrome.js autoBootMenus callbacks can call it lazily
  window.applyTheme = applyTheme;

  // Apply stored theme on boot
  applyTheme(getStoredTheme());
})();
