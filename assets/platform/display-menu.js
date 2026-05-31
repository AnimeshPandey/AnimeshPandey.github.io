/**
 * display-menu.js — unified PopoverMenu helpers for theme + casebook display
 */
(function (global) {
  'use strict';

  function initThemeMenu(btn, menu, onPick) {
    if (!btn || !menu || !global.PrefsChrome) return;
    return global.PrefsChrome.PopoverMenu(btn, menu, {
      onSelect: function (e, ctx) {
        var item = e.target.closest('.theme-menu-item[data-t]');
        if (!item) return;
        if (onPick) onPick(item.dataset.t);
        ctx.close();
      },
      onActivate: function (e, ctx) {
        var active = document.activeElement;
        if (active && active.dataset && active.dataset.t && onPick) {
          onPick(active.dataset.t);
          ctx.close();
        }
      }
    });
  }

  function initRadioGroup(menu, selector, onPick, close) {
    if (!menu) return;
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest(selector);
      if (!btn || !menu.contains(btn)) return;
      if (onPick) onPick(btn);
      if (close) close();
    });
  }

  global.DisplayMenu = {
    initThemeMenu: initThemeMenu,
    initRadioGroup: initRadioGroup
  };
})(typeof window !== 'undefined' ? window : this);
