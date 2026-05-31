/**
 * casebook-preferences.js
 * Appearance (light/dark/system), contrast (high/normal), prefs menu,
 * PRM class, meta theme-color, casebook-color-change event.
 */
(function initCasebookPreferences(root) {
  if (root.dataset.casebookInit) return;
  root.dataset.casebookInit = 'true';

  var COLOR_KEY = 'casebook-color-mode';
  var CONTRAST_KEY = 'casebook-contrast';
  var THEME_COLORS = { light: '#FAF8F4', dark: '#141210' };
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function getColorMode() {
    try { return localStorage.getItem(COLOR_KEY) || 'system'; } catch (e) { return 'system'; }
  }

  function getContrastMode() {
    try { return localStorage.getItem(CONTRAST_KEY) || 'high'; } catch (e) { return 'high'; }
  }

  function resolveColor(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return mq.matches ? 'dark' : 'light';
  }

  function applyContrast(contrast) {
    document.documentElement.dataset.casebookContrast = contrast === 'normal' ? 'normal' : 'high';
    var cbtns = document.querySelectorAll('[data-contrast-mode]');
    for (var i = 0; i < cbtns.length; i++) {
      cbtns[i].setAttribute('aria-checked', cbtns[i].dataset.contrastMode === contrast ? 'true' : 'false');
    }
  }

  function applyColor(mode, skipTransition) {
    var resolved = resolveColor(mode);
    if (!skipTransition) {
      document.documentElement.classList.add('casebook-color-transition');
      setTimeout(function () {
        document.documentElement.classList.remove('casebook-color-transition');
      }, 250);
    }
    document.documentElement.dataset.casebookColor = resolved;

    var meta = document.getElementById('casebook-theme-color');
    if (meta) meta.content = THEME_COLORS[resolved] || THEME_COLORS.light;

    var btns = document.querySelectorAll('[data-color-mode]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-checked', btns[i].dataset.colorMode === mode ? 'true' : 'false');
    }

    document.dispatchEvent(new CustomEvent('casebook-color-change', {
      detail: { mode: mode, resolved: resolved },
      bubbles: true,
    }));
  }

  function applyAll(skipTransition) {
    applyColor(getColorMode(), skipTransition);
    applyContrast(getContrastMode());
  }

  function applyPRM() {
    if (mqMotion.matches) {
      document.documentElement.classList.add('casebook--reduce-motion');
    } else {
      document.documentElement.classList.remove('casebook--reduce-motion');
    }
  }

  applyPRM();
  mqMotion.addEventListener('change', applyPRM);
  applyAll(true);

  mq.addEventListener('change', function () {
    if (getColorMode() === 'system') applyColor('system');
  });

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
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  menu.addEventListener('click', function (e) {
    var colorBtn = e.target.closest('[data-color-mode]');
    if (colorBtn) {
      var mode = colorBtn.dataset.colorMode;
      try { localStorage.setItem(COLOR_KEY, mode); } catch (err) {}
      applyColor(mode);
      closeMenu();
      return;
    }
    var contrastBtn = e.target.closest('[data-contrast-mode]');
    if (contrastBtn) {
      var contrast = contrastBtn.dataset.contrastMode;
      try { localStorage.setItem(CONTRAST_KEY, contrast); } catch (err) {}
      applyContrast(contrast);
      closeMenu();
    }
  });

  menu.addEventListener('keydown', function (e) {
    var items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitemradio"]'));
    var idx = items.indexOf(document.activeElement);
    switch (e.key) {
      case 'Escape':
        closeMenu();
        break;
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
        if (document.activeElement && document.activeElement.getAttribute('role') === 'menuitemradio') {
          document.activeElement.click();
        }
        break;
      case 'Tab':
        closeMenu();
        break;
    }
  });

  document.addEventListener('click', function () {
    if (!menu.hidden) closeMenu();
  });
  menu.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}(document.documentElement));
