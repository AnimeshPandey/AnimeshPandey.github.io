/**
 * casey-companion-prefs.js — Casey intensity + milestone display in prefs menus.
 */
(function initCaseyCompanionPrefs() {
  'use strict';

  var STORAGE_KEY = 'casebook-companion-v1';

  function loadState() {
    if (window.CaseyCompanion && window.CaseyCompanion.getState) {
      return window.CaseyCompanion.getState();
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveIntensity(value) {
    var state = loadState();
    state.caseyIntensity = value;
    if (window.CaseyCompanion && window.CaseyCompanion.saveState) {
      window.CaseyCompanion.saveState(state);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* ignore */ }
    }
    document.dispatchEvent(
      new CustomEvent('casey-companion-event', {
        detail: { type: 'casey-intensity-change', state: state },
      })
    );
  }

  function milestoneRows(state) {
    var rows = [
      { id: 'first-case-completed', label: 'First case completed' },
      { id: 'five-cases', label: 'Five cases completed' },
    ];
    return rows.map(function (r) {
      var done = state.milestones && state.milestones.indexOf(r.id) !== -1;
      return (
        '<li class="casey-prefs-milestone' +
        (done ? ' casey-prefs-milestone--done' : '') +
        '">' +
        (done ? '✓ ' : '○ ') +
        r.label +
        '</li>'
      );
    }).join('');
  }

  function bindIntensityRadios(root) {
    if (!root) return;
    var state = loadState();
    var current = state.caseyIntensity || 'full';
    root.querySelectorAll('[data-casey-intensity]').forEach(function (btn) {
      var val = btn.getAttribute('data-casey-intensity');
      btn.setAttribute('aria-checked', val === current ? 'true' : 'false');
      btn.addEventListener('click', function () {
        saveIntensity(val);
        root.querySelectorAll('[data-casey-intensity]').forEach(function (b) {
          b.setAttribute('aria-checked', b.getAttribute('data-casey-intensity') === val ? 'true' : 'false');
        });
      });
    });
    var list = root.querySelector('[data-casey-milestones]');
    if (list) {
      list.innerHTML = milestoneRows(state);
    }
  }

  function wireMenus() {
    document.querySelectorAll('[data-casey-prefs-root]').forEach(bindIntensityRadios);
  }

  document.addEventListener('casey-companion-event', function () {
    document.querySelectorAll('[data-casey-prefs-root]').forEach(function (root) {
      var list = root.querySelector('[data-casey-milestones]');
      if (list) list.innerHTML = milestoneRows(loadState());
    });
  });

  function wireCaseyPrefsPopover() {
    var btn = document.getElementById('casebook-prefs-btn');
    var menu = document.getElementById('casebook-prefs-menu');
    if (!btn || !menu || !window.PrefsChrome || !window.PrefsChrome.PopoverMenu) return;
    window.PrefsChrome.PopoverMenu(btn, menu, {
      onSelect: function (e) {
        if (e.target.closest('[data-casey-intensity]')) return;
      },
    });
  }

  function boot() {
    wireMenus();
    wireCaseyPrefsPopover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
