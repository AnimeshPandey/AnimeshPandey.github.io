/**
 * casebook-preferences.js — wires the casebook palette button to portfolio's
 * shared applyTheme() function. Motion preference is handled independently.
 */
(function initCasebookPreferences() {
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyPRM() {
    document.documentElement.classList.toggle('casebook--reduce-motion', mqMotion.matches);
  }
  applyPRM();
  mqMotion.addEventListener('change', applyPRM);

  function bind() {
    var btn = document.getElementById('casebook-prefs-btn');
    var menu = document.getElementById('casebook-prefs-menu');
    if (!btn || !menu || !window.PrefsChrome || !window.applyTheme) return;

    menu.setAttribute('data-popover-fixed', 'false');
    window.PrefsChrome.PopoverMenu(btn, menu, {
      onSelect: function (e, ctx) {
        var item = e.target.closest('.theme-menu-item[data-t]');
        if (!item) return;
        window.applyTheme(item.dataset.t);
        ctx.close();
      },
      onActivate: function (e, ctx) {
        var active = document.activeElement;
        if (active && active.dataset && active.dataset.t) {
          window.applyTheme(active.dataset.t);
          ctx.close();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
}());
