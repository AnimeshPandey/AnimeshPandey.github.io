/**
 * prefs-chrome.js — shared popover menus (portfolio + casebook).
 *
 * Owns the full lifecycle of all .theme-pick-btn and .lang-pick-btn buttons:
 *   1. PopoverMenu()     — bind a single btn/menu pair (guard-protected, idempotent)
 *   2. autoBootMenus()  — scan the DOM and bind every picker button on DOMContentLoaded
 *
 * Lazy callbacks: applyTheme / AP_I18N.setLocale are resolved at click-time,
 * not at setup-time, so the order of defer-script execution doesn't matter.
 */
(function (global) {
  'use strict';

  var openMenus = [];
  var docBound = false;

  function isFixed(menu) {
    return menu.getAttribute('data-popover-fixed') === 'true' ||
      menu.classList.contains('prefs-menu--fixed');
  }

  function positionFixed(menu, btn) {
    var rect = btn.getBoundingClientRect();
    menu.classList.add('prefs-menu--fixed');
    menu.style.position = 'fixed';
    menu.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
    menu.style.left = 'auto';
    menu.style.top = 'auto';
    menu.style.bottom = Math.max(8, window.innerHeight - rect.top + 8) + 'px';
    menu.style.minWidth = Math.max(192, rect.width) + 'px';
    menu.style.maxHeight = Math.min(320, rect.top - 16) + 'px';
    menu.style.overflowY = 'auto';
  }

  function clearFixed(menu) {
    menu.classList.remove('prefs-menu--fixed');
    menu.style.position = '';
    menu.style.right = '';
    menu.style.left = '';
    menu.style.top = '';
    menu.style.bottom = '';
    menu.style.minWidth = '';
    menu.style.maxHeight = '';
    menu.style.overflowY = '';
  }

  function closeEntry(entry) {
    if (!entry || entry.menu.hidden) return;
    entry.menu.hidden = true;
    entry.btn.setAttribute('aria-expanded', 'false');
    entry.menu.querySelectorAll('[role="option"]').forEach(function (el) {
      el.setAttribute('tabindex', '-1');
    });
    if (isFixed(entry.menu)) clearFixed(entry.menu);
    var i = openMenus.indexOf(entry);
    if (i !== -1) openMenus.splice(i, 1);
  }

  function closeAll(except) {
    openMenus.slice().forEach(function (entry) {
      if (entry !== except) closeEntry(entry);
    });
  }

  function focusableIn(menu) {
    return Array.prototype.slice.call(
      menu.querySelectorAll(
        'button, [href], [role="option"], [role="menuitemradio"], [tabindex="0"]'
      )
    ).filter(function (el) { return !el.hidden && el.offsetParent !== null; });
  }

  function bindDocument() {
    if (docBound) return;
    docBound = true;
    document.addEventListener('click', function (e) {
      openMenus.slice().forEach(function (entry) {
        if (entry.menu.contains(e.target) || entry.btn.contains(e.target)) return;
        closeEntry(entry);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var last = openMenus[openMenus.length - 1];
      if (last) {
        closeEntry(last);
        last.btn.focus();
      }
    });
  }

  function PopoverMenu(btn, menu, options) {
    if (!btn || !menu) return null;
    if (btn.dataset.prefsPopoverBound === '1') {
      return btn._prefsPopoverApi || null;
    }
    btn.dataset.prefsPopoverBound = '1';
    options = options || {};
    bindDocument();

    var entry = { btn: btn, menu: menu, options: options };

    function open() {
      closeAll(entry);
      if (isFixed(menu) || btn.closest('#mobile-nav')) {
        menu.setAttribute('data-popover-fixed', 'true');
        positionFixed(menu, btn);
      }
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      menu.querySelectorAll('[role="option"]').forEach(function (el) {
        el.setAttribute('tabindex', '0');
      });
      var items = focusableIn(menu);
      if (items.length) items[0].focus();
      if (openMenus.indexOf(entry) === -1) openMenus.push(entry);
    }

    function close() {
      closeEntry(entry);
      btn.focus();
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) open();
      else close();
    });

    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      if (options.onSelect) options.onSelect(e, { close: close });
    });

    menu.addEventListener('keydown', function (e) {
      var items = focusableIn(menu);
      var idx = items.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (idx === -1) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      }
      if ((e.key === 'Enter' || e.key === ' ') && options.onActivate) {
        e.preventDefault();
        options.onActivate(e, { close: close });
      }
      if (e.key === 'Tab') close();
    });

    var api = { open: open, close: close, entry: entry };
    btn._prefsPopoverApi = api;
    return api;
  }

  /**
   * autoBootMenus — scan the entire document for picker buttons and bind them.
   *
   * Callbacks are LAZY: window.applyTheme and window.AP_I18N are resolved at
   * click-time so it doesn't matter if theme.js / i18n.js haven't run yet when
   * autoBootMenus() executes.  The prefsPopoverBound guard makes this idempotent.
   */
  function autoBootMenus() {
    // ── Theme pickers ────────────────────────────────────────────────────────
    document.querySelectorAll('.theme-pick-btn').forEach(function (btn) {
      if (btn.classList.contains('lang-pick-btn')) return;
      var menuId = btn.getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      if (!menu) return;
      PopoverMenu(btn, menu, {
        onSelect: function (e, ctx) {
          var item = e.target.closest('.theme-menu-item[data-t]');
          if (!item) return;
          if (typeof global.applyTheme === 'function') global.applyTheme(item.dataset.t);
          ctx.close();
        },
        onActivate: function (e, ctx) {
          var active = document.activeElement;
          if (active && active.dataset && active.dataset.t) {
            if (typeof global.applyTheme === 'function') global.applyTheme(active.dataset.t);
            ctx.close();
          }
        }
      });
    });

    // ── Language pickers ─────────────────────────────────────────────────────
    document.querySelectorAll('.lang-pick-btn').forEach(function (btn) {
      var menuId = btn.getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      if (!menu) return;
      // Fixed positioning when inside the mobile drawer
      if (btn.closest('#mobile-nav')) {
        menu.setAttribute('data-popover-fixed', 'true');
      }
      PopoverMenu(btn, menu, {
        onSelect: function (e, ctx) {
          var item = e.target.closest('.lang-menu-item[data-l]');
          if (!item) return;
          if (global.AP_I18N && typeof global.AP_I18N.setLocale === 'function') {
            global.AP_I18N.setLocale(item.dataset.l);
          }
          ctx.close();
        },
        onActivate: function (e, ctx) {
          var active = document.activeElement;
          if (active && active.dataset && active.dataset.l) {
            if (global.AP_I18N && typeof global.AP_I18N.setLocale === 'function') {
              global.AP_I18N.setLocale(active.dataset.l);
            }
            ctx.close();
          }
        }
      });
    });
  }

  // Run as soon as the DOM is parsed. With defer loading this fires immediately
  // (readyState is 'interactive'); guard for any inline/early inclusion too.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBootMenus);
  } else {
    autoBootMenus();
  }

  global.PrefsChrome = {
    PopoverMenu: PopoverMenu,
    closeAll: closeAll,
    autoBootMenus: autoBootMenus
  };
})(typeof window !== 'undefined' ? window : this);
