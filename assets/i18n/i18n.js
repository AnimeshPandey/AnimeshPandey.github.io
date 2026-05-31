/* === assets/i18n/i18n.js === */
(function () {
  'use strict';

  var LOCALES = ['en', 'hi', 'es'];
  var RTL_LOCALES = [];
  var DEFAULT_LOCALE = 'en';

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

  function detectLocale() {
    try {
      var stored = localStorage.getItem('locale');
      if (stored && LOCALES.indexOf(stored) !== -1) return stored;
    } catch (e) {}
    var nav = (navigator.language || '').toLowerCase();
    for (var i = 0; i < LOCALES.length; i++) {
      if (LOCALES[i].toLowerCase() === nav) return LOCALES[i];
    }
    var prefix = nav.split('-')[0];
    for (var j = 0; j < LOCALES.length; j++) {
      if (LOCALES[j].toLowerCase().split('-')[0] === prefix) return LOCALES[j];
    }
    return DEFAULT_LOCALE;
  }

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

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(dict, key);
      if (val == null) return;
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t(dict, key);
      if (val != null) el.innerHTML = val;
    });

    applyListTemplates(dict);
  }

  function applyListTemplates(dict) {
    document.querySelectorAll('[data-i18n-list]').forEach(function (container) {
      var path = container.getAttribute('data-i18n-list');
      var parts = path.split('.');
      var arr = dict;
      for (var i = 0; i < parts.length; i++) {
        if (!arr) return;
        arr = arr[parts[i]];
      }
      if (!Array.isArray(arr)) return;
      var tpl = container.querySelector('[data-i18n-item]');
      if (!tpl) return;
      var parent = tpl.parentNode;
      parent.querySelectorAll('[data-i18n-item]').forEach(function (n) { n.remove(); });
      arr.forEach(function (item, idx) {
        var node = tpl.cloneNode(true);
        node.removeAttribute('data-i18n-item');
        node.querySelectorAll('[data-i18n-field]').forEach(function (field) {
          var f = field.getAttribute('data-i18n-field');
          if (item[f] != null) {
            if (field.tagName === 'UL' || field.classList.contains('i18n-bullets')) {
              field.innerHTML = (item[f] || []).map(function (b) {
                return '<li>' + b + '</li>';
              }).join('');
            } else {
              field.textContent = item[f];
            }
          }
        });
        parent.appendChild(node);
      });
    });
  }

  function applyLangMeta(locale) {
    document.documentElement.lang = locale === 'hi' ? 'hi' : (locale === 'es' ? 'es' : 'en');
    document.documentElement.dir = RTL_LOCALES.indexOf(locale) !== -1 ? 'rtl' : 'ltr';
  }

  function applyMeta(dict) {
    if (!dict || !dict.meta) return;
    if (dict.meta.title) document.title = dict.meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && dict.meta.description) desc.setAttribute('content', dict.meta.description);
  }

  function syncPicker(locale) {
    document.querySelectorAll('.lang-menu-item').forEach(function (item) {
      item.setAttribute('aria-selected', item.dataset.l === locale ? 'true' : 'false');
    });
    document.querySelectorAll('.lang-pick-btn').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Language: ' + locale.toUpperCase() + '. Change');
      var lbl = btn.querySelector('.lang-pick-label');
      if (lbl) lbl.textContent = locale.toUpperCase().slice(0, 2);
    });
  }

  var currentLocale = DEFAULT_LOCALE;
  var dictCache = {};

  function setLocale(locale, silent) {
    if (LOCALES.indexOf(locale) === -1) locale = DEFAULT_LOCALE;

    function finish(dict) {
      dictCache[locale] = dict;
      currentLocale = locale;
      applyTranslations(dict);
      applyLangMeta(locale);
      applyMeta(dict);
      syncPicker(locale);
      try { localStorage.setItem('locale', locale); } catch (e) {}
      if (!silent) announce('Language changed to ' + locale);
    }

    if (dictCache[locale]) {
      finish(dictCache[locale]);
      return;
    }

    fetch('/assets/i18n/locales/' + locale + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(finish)
      .catch(function () {
        if (locale !== DEFAULT_LOCALE) setLocale(DEFAULT_LOCALE, true);
        else announce('Could not load language');
      });
  }

  function initLangPicker(btn, menu) {
    if (!window.PrefsChrome || !menu) return;
    menu.setAttribute('data-popover-fixed', btn.closest('#mobile-nav') ? 'true' : 'false');
    window.PrefsChrome.PopoverMenu(btn, menu, {
      onSelect: function (e, ctx) {
        var item = e.target.closest('.lang-menu-item');
        if (!item || !item.dataset.l) return;
        setLocale(item.dataset.l);
        ctx.close();
      },
      onActivate: function (e, ctx) {
        var active = document.activeElement;
        if (active && active.dataset && active.dataset.l) {
          setLocale(active.dataset.l);
          ctx.close();
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-pick-btn').forEach(function (btn) {
      var menuId = btn.getAttribute('aria-controls');
      initLangPicker(btn, menuId ? document.getElementById(menuId) : null);
    });
    setLocale(detectLocale(), true);
  });

  window.AP_I18N = {
    setLocale: setLocale,
    getLocale: function () { return currentLocale; },
    t: function (key) { return t(dictCache[currentLocale] || {}, key); }
  };
})();
