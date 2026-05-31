/* === theme.js ===
   Multi-theme picker — FOUC guard is inlined in each HTML <head>.
   This file wires the picker UI, persists the choice, and updates meta theme-color.
*/
(function () {
  'use strict';

  var THEMES = [
    { id: 'light',          label: 'Warm paper' },
    { id: 'dark',           label: 'Charcoal' },
    { id: 'sage',           label: 'Sage mist' },
    { id: 'slate',          label: 'Slate studio' },
    { id: 'dusk',           label: 'Dusk editorial' },
    { id: 'high-contrast',  label: 'High contrast' }
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
      return isValidTheme(t) ? t : 'dark';
    } catch (e) { return 'dark'; }
  }

  function applyTheme(id) {
    if (!isValidTheme(id)) id = 'dark';

    document.documentElement.dataset.theme = id;
    try { localStorage.setItem('theme', id); } catch (e) {}

    /* meta theme-color — read from CSS token after paint */
    requestAnimationFrame(function () {
      var metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        var v = getComputedStyle(document.documentElement)
                  .getPropertyValue('--theme-color-val').trim();
        if (v) metaTheme.content = v;
      }
    });

    /* Picker: sync aria-selected on all items (there may be multiple pickers per page) */
    var items = document.querySelectorAll('.theme-menu-item');
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute('aria-selected', items[i].dataset.t === id ? 'true' : 'false');
    }

    /* Picker button: update label */
    var btns = document.querySelectorAll('.theme-pick-btn');
    for (var j = 0; j < btns.length; j++) {
      var lbl = id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ');
      btns[j].setAttribute('aria-label', 'Theme: ' + lbl + '. Change');
    }
  }

  /* ── Picker open / close helpers ── */
  function openPicker(menu, btn) {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var sel = menu.querySelector('[aria-selected="true"]') ||
              menu.querySelector('.theme-menu-item');
    if (sel) { sel.setAttribute('tabindex', '0'); sel.focus(); }
  }

  function closePicker(menu, btn) {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  function initPicker(btn, menu) {
    if (!btn || !menu) return;

    /* Toggle */
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) openPicker(menu, btn);
      else             closePicker(menu, btn);
    });

    /* Item activation */
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.theme-menu-item');
      if (!item || !item.dataset.t) return;
      applyTheme(item.dataset.t);
      closePicker(menu, btn);
    });

    /* Keyboard: arrows + Enter/Space + Escape + Tab */
    menu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(
        menu.querySelectorAll('.theme-menu-item')
      );
      var idx = items.indexOf(document.activeElement);

      switch (e.key) {
        case 'Escape': closePicker(menu, btn); break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          items[(idx + 1) % items.length].focus();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          items[(idx - 1 + items.length) % items.length].focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          var active = document.activeElement;
          if (active && active.dataset.t) {
            applyTheme(active.dataset.t);
            closePicker(menu, btn);
          }
          break;
        case 'Tab':
          closePicker(menu, btn);
          break;
      }
    });

    /* Close on click outside */
    document.addEventListener('click', function () {
      if (!menu.hidden) closePicker(menu, btn);
    });
    /* Prevent self-close on inside click */
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getStoredTheme());

    /* Wire every picker instance on the page (header + mobile nav footer) */
    var btns = document.querySelectorAll('.theme-pick-btn');
    for (var i = 0; i < btns.length; i++) {
      var menuId = btns[i].getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      initPicker(btns[i], menu);
    }
  });
})();
