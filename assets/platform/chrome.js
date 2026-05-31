/**
 * Shared menu helper — portfolio theme/lang pickers, casebook prefs.
 * initPlatformMenu(trigger, menu, { onSelect })
 */
(function (global) {
  'use strict';

  function initPlatformMenu(trigger, menu, options) {
    if (!trigger || !menu) return;

    options = options || {};

    function open() {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      var first =
        menu.querySelector('[tabindex="0"]') ||
        menu.querySelector('button, [role="menuitemradio"], [role="option"], a');
      if (first) first.focus();
    }

    function close() {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) open();
      else close();
    });

    if (options.onSelect) {
      menu.addEventListener('click', options.onSelect);
    }

    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      var items = Array.prototype.slice.call(
        menu.querySelectorAll('button, [role="menuitemradio"], [role="option"]')
      );
      var idx = items.indexOf(document.activeElement);
      if (idx === -1) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      }
    });

    document.addEventListener('click', function () {
      if (!menu.hidden) close();
    });
    menu.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    return { open: open, close: close };
  }

  global.PlatformChrome = { initPlatformMenu: initPlatformMenu };
})(typeof window !== 'undefined' ? window : this);
