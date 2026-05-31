/**
 * casebook-preferences.js
 * Manages: appearance (light/dark/system), prefs menu UI,
 *          PRM class, meta theme-color, casebook-color-change event.
 *
 * localStorage key: casebook-color-mode → 'light' | 'dark' | 'system'
 * HTML attr: data-casebook-color="light|dark" (never 'system')
 */
(function initCasebookPreferences(root) {
  if (root.dataset.casebookInit) return;
  root.dataset.casebookInit = 'true';

  var KEY = 'casebook-color-mode';
  var THEME_COLORS = { light: '#FAF8F4', dark: '#141210' };
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── 1. Compute & apply resolved color ── */
  function getStored() {
    try { return localStorage.getItem(KEY) || 'system'; } catch (e) { return 'system'; }
  }

  function resolve(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return mq.matches ? 'dark' : 'light';
  }

  function applyColor(mode, skipTransition) {
    var resolved = resolve(mode);
    if (!skipTransition) {
      document.documentElement.classList.add('casebook-color-transition');
      setTimeout(function () {
        document.documentElement.classList.remove('casebook-color-transition');
      }, 250);
    }
    document.documentElement.dataset.casebookColor = resolved;

    /* meta theme-color */
    var meta = document.getElementById('casebook-theme-color');
    if (meta) meta.content = THEME_COLORS[resolved] || THEME_COLORS.light;

    /* Update prefs menu aria-checked */
    var btns = document.querySelectorAll('[data-color-mode]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-checked', btns[i].dataset.colorMode === mode ? 'true' : 'false');
    }

    /* Dispatch event for casey-coach.js, casey-voice.js */
    document.dispatchEvent(new CustomEvent('casebook-color-change', {
      detail: { mode: mode, resolved: resolved },
      bubbles: true,
    }));
  }

  /* ── 2. PRM class ── */
  function applyPRM() {
    if (mqMotion.matches) {
      document.documentElement.classList.add('casebook--reduce-motion');
    } else {
      document.documentElement.classList.remove('casebook--reduce-motion');
    }
  }
  applyPRM();
  mqMotion.addEventListener('change', applyPRM);

  /* ── 3. Apply stored mode (FOUC guard already set attr before paint) ── */
  applyColor(getStored(), true);

  /* ── 4. Watch system preference when mode is 'system' ── */
  mq.addEventListener('change', function () {
    if (getStored() === 'system') applyColor('system');
  });

  /* ── 5. Prefs menu interactions ── */
  var btn = document.getElementById('casebook-prefs-btn');
  var menu = document.getElementById('casebook-prefs-menu');
  if (!btn || !menu) return;

  function openMenu() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var first = menu.querySelector('[role="menuitemradio"]');
    if (first) first.focus();
  }

  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.hidden) openMenu(); else closeMenu();
  });

  menu.addEventListener('click', function (e) {
    var target = e.target.closest('[data-color-mode]');
    if (!target) return;
    var mode = target.dataset.colorMode;
    try { localStorage.setItem(KEY, mode); } catch (err) {}
    applyColor(mode);
    closeMenu();
  });

  menu.addEventListener('keydown', function (e) {
    var items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitemradio"]'));
    var idx = items.indexOf(document.activeElement);
    switch (e.key) {
      case 'Escape': closeMenu(); break;
      case 'ArrowDown': case 'ArrowRight':
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
        break;
      case 'ArrowUp': case 'ArrowLeft':
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
        break;
      case 'Enter': case ' ':
        e.preventDefault();
        if (document.activeElement && document.activeElement.dataset.colorMode) {
          document.activeElement.click();
        }
        break;
      case 'Tab': closeMenu(); break;
    }
  });

  document.addEventListener('click', function () {
    if (!menu.hidden) closeMenu();
  });
  menu.addEventListener('click', function (e) { e.stopPropagation(); });

}(document.documentElement));
