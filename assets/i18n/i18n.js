/* === assets/i18n/i18n.js ===
   Lightweight i18n engine — no build step, vanilla JS.

   Usage (all pages):
     <script src="/assets/i18n/i18n.js" defer></script>

   HTML data attributes:
     data-i18n="key.path"           → sets textContent
     data-i18n="key.path" data-i18n-attr="aria-label"  → sets named attribute
     data-i18n="key.path" data-i18n-attr="content"     → sets meta content

   Public API:  window.AP_I18N = { setLocale, getLocale, t }
*/
(function () {
  'use strict';

  /* ── Supported locales ── */
  var LOCALES = ['en', 'hi', 'es', 'fr', 'de', 'pt-BR', 'ja', 'zh-Hans', 'ar'];
  var RTL_LOCALES = ['ar'];
  var DEFAULT_LOCALE = 'en';

  /* ── Live announce region ── */
  var announcer = null;
  function announce(msg) {
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'visually-hidden';
      document.body.appendChild(announcer);
    }
    announcer.textContent = msg;
  }

  /* ── Locale detection ── */
  function detectLocale() {
    try {
      var stored = localStorage.getItem('locale');
      if (stored && LOCALES.indexOf(stored) !== -1) return stored;
    } catch (e) {}

    /* navigator.language → normalise to our supported list */
    var nav = (navigator.language || '').toLowerCase();
    /* Exact match */
    for (var i = 0; i < LOCALES.length; i++) {
      if (LOCALES[i].toLowerCase() === nav) return LOCALES[i];
    }
    /* Prefix match (e.g. 'en-IN' → 'en') */
    var prefix = nav.split('-')[0];
    for (var j = 0; j < LOCALES.length; j++) {
      if (LOCALES[j].toLowerCase().split('-')[0] === prefix) return LOCALES[j];
    }
    return DEFAULT_LOCALE;
  }

  /* ── Deep key lookup: t(dict, 'hero.ctaResume') ── */
  function t(dict, key) {
    if (!dict || !key) return null;
    var parts = key.split('.');
    var val = dict;
    for (var i = 0; i < parts.length; i++) {
      if (val == null || typeof val !== 'object') return null;
      val = val[parts[i]];
    }
    return (typeof val === 'string') ? val : null;
  }

  /* ── Apply translations to DOM ── */
  function applyTranslations(dict) {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-i18n');
      var val = t(dict, key);
      if (val == null) {
        /* Missing key — log in dev, fall through */
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('[i18n] Missing key:', key);
        }
        continue;
      }
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, val);
      } else {
        el.textContent = val;
      }
    }
  }

  /* ── Update <html lang> and dir ── */
  function applyLangMeta(locale) {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.indexOf(locale) !== -1 ? 'rtl' : 'ltr';
  }

  /* ── Sync picker UI ── */
  function syncPicker(locale) {
    var items = document.querySelectorAll('.lang-menu-item');
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute('aria-selected',
        items[i].dataset.l === locale ? 'true' : 'false');
    }
    var btns = document.querySelectorAll('.lang-pick-btn');
    for (var j = 0; j < btns.length; j++) {
      btns[j].setAttribute('aria-label', 'Language: ' + locale.toUpperCase() + '. Change');
      btns[j].querySelector('.lang-pick-label') &&
        (btns[j].querySelector('.lang-pick-label').textContent = locale.toUpperCase().slice(0, 2));
    }
  }

  /* ── Load locale JSON and apply ── */
  var currentLocale = DEFAULT_LOCALE;
  var dictCache = {};

  function setLocale(locale, silent) {
    if (LOCALES.indexOf(locale) === -1) locale = DEFAULT_LOCALE;

    /* Cache hit */
    if (dictCache[locale]) {
      currentLocale = locale;
      applyTranslations(dictCache[locale]);
      applyLangMeta(locale);
      syncPicker(locale);
      try { localStorage.setItem('locale', locale); } catch (e) {}
      if (!silent) announce('Language changed to ' + locale);
      return;
    }

    /* Fetch */
    fetch('/assets/i18n/locales/' + locale + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (dict) {
        dictCache[locale] = dict;
        currentLocale = locale;
        applyTranslations(dict);
        applyLangMeta(locale);
        syncPicker(locale);
        try { localStorage.setItem('locale', locale); } catch (e) {}
        if (!silent) announce('Language changed to ' + locale);
      })
      .catch(function (err) {
        console.warn('[i18n] Could not load locale', locale, err);
        /* Fall back to EN if not already EN */
        if (locale !== DEFAULT_LOCALE) setLocale(DEFAULT_LOCALE, true);
      });
  }

  /* ── Picker open / close ── */
  function openLangPicker(menu, btn) {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var sel = menu.querySelector('[aria-selected="true"]') ||
              menu.querySelector('.lang-menu-item');
    if (sel) { sel.setAttribute('tabindex', '0'); sel.focus(); }
  }

  function closeLangPicker(menu, btn) {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  function initPicker(btn, menu) {
    if (!btn || !menu) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) openLangPicker(menu, btn);
      else             closeLangPicker(menu, btn);
    });

    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.lang-menu-item');
      if (!item || !item.dataset.l) return;
      setLocale(item.dataset.l);
      closeLangPicker(menu, btn);
    });

    menu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('.lang-menu-item'));
      var idx = items.indexOf(document.activeElement);
      switch (e.key) {
        case 'Escape': closeLangPicker(menu, btn); break;
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
          if (document.activeElement && document.activeElement.dataset.l) {
            setLocale(document.activeElement.dataset.l);
            closeLangPicker(menu, btn);
          }
          break;
        case 'Tab': closeLangPicker(menu, btn); break;
      }
    });

    document.addEventListener('click', function () {
      if (!menu.hidden) closeLangPicker(menu, btn);
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  /* ── Bootstrap ── */
  document.addEventListener('DOMContentLoaded', function () {
    var locale = detectLocale();

    /* Wire all picker instances (header + mobile nav) */
    var btns = document.querySelectorAll('.lang-pick-btn');
    for (var i = 0; i < btns.length; i++) {
      var menuId = btns[i].getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      initPicker(btns[i], menu);
    }

    /* Initial load — skip announce on first load */
    setLocale(locale, true);
  });

  /* ── Public API ── */
  window.AP_I18N = {
    setLocale: setLocale,
    getLocale: function () { return currentLocale; },
    t: function (key) { return t(dictCache[currentLocale] || {}, key); }
  };
})();
