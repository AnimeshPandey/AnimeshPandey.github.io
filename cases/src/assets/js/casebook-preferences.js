/**
 * casebook-preferences.js — display menu (aligned with portfolio theme picker)
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
    document.querySelectorAll('[data-contrast-mode]').forEach(function (btn) {
      btn.setAttribute('aria-checked', btn.dataset.contrastMode === contrast ? 'true' : 'false');
    });
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
    document.querySelectorAll('[data-color-mode]').forEach(function (btn) {
      btn.setAttribute('aria-checked', btn.dataset.colorMode === mode ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('casebook-color-change', {
      detail: { mode: mode, resolved: resolved },
      bubbles: true
    }));
  }

  function syncPortfolioThemeSwatches() {
    var themeId = window.ThemeBridge ? window.ThemeBridge.getPortfolioTheme() : 'high-contrast';
    document.querySelectorAll('#casebook-portfolio-themes .theme-menu-item[data-t]').forEach(function (item) {
      item.setAttribute('aria-selected', item.dataset.t === themeId ? 'true' : 'false');
    });
  }

  function applyAll(skipTransition) {
    applyColor(getColorMode(), skipTransition);
    applyContrast(getContrastMode());
    syncPortfolioThemeSwatches();
  }

  function applyPRM() {
    document.documentElement.classList.toggle('casebook--reduce-motion', mqMotion.matches);
  }

  applyPRM();
  mqMotion.addEventListener('change', applyPRM);
  applyAll(true);
  mq.addEventListener('change', function () {
    if (getColorMode() === 'system') applyColor('system');
  });

  var btn = document.getElementById('casebook-prefs-btn');
  var menu = document.getElementById('casebook-prefs-menu');
  if (!btn || !menu || !window.PrefsChrome) return;

  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  window.PrefsChrome.PopoverMenu(btn, menu, {
    onSelect: function (e, ctx) {
      var colorBtn = e.target.closest('[data-color-mode]');
      if (colorBtn) {
        try { localStorage.setItem(COLOR_KEY, colorBtn.dataset.colorMode); } catch (err) {}
        applyColor(colorBtn.dataset.colorMode);
        ctx.close();
        return;
      }
      var contrastBtn = e.target.closest('[data-contrast-mode]');
      if (contrastBtn) {
        try { localStorage.setItem(CONTRAST_KEY, contrastBtn.dataset.contrastMode); } catch (err) {}
        applyContrast(contrastBtn.dataset.contrastMode);
        ctx.close();
        return;
      }
      var themeItem = e.target.closest('#casebook-portfolio-themes .theme-menu-item[data-t]');
      if (themeItem && window.ThemeBridge) {
        var tid = themeItem.dataset.t;
        try { localStorage.setItem('theme', tid); } catch (err) {}
        window.ThemeBridge.applyCasebookFromPortfolio(tid);
        syncPortfolioThemeSwatches();
        ctx.close();
      }
    }
  });
}(document.documentElement));
