/**
 * casey-companion-prefs.js — Casey settings panel: tier, intensity, progress.
 */
(function initCaseyCompanionPrefs() {
  'use strict';

  var STORAGE_KEY = 'casebook-companion-v1';
  var TIER_LABELS = {
    junior: 'Casey · Junior dev',
    mid: 'Casey · Mid-level dev',
    staff: 'Casey · Staff engineer',
  };

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

  function liveTotal() {
    var bar = document.querySelector('[data-casebook-progress-bar]');
    if (bar && bar.getAttribute('aria-valuemax')) {
      return parseInt(bar.getAttribute('aria-valuemax'), 10) || 31;
    }
    return 31;
  }

  function liveCompleted(state) {
    var completed = state.casesCompleted || [];
    var el = document.getElementById('hub-live-cases');
    if (!el) return completed.length;
    try {
      var d = JSON.parse(el.textContent);
      var slugs = (d.cases || []).map(function (c) { return c.slug; });
      if (!slugs.length) return completed.length;
      return completed.filter(function (s) { return slugs.indexOf(s) !== -1; }).length;
    } catch (e) {
      return completed.length;
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
      { id: 'hub-visit', label: 'Visited the hub' },
    ];
    var ms = state.milestones || [];
    return rows
      .map(function (r) {
        var done = ms.indexOf(r.id) !== -1;
        return (
          '<li class="casey-prefs-milestone' +
          (done ? ' casey-prefs-milestone--done' : '') +
          '">' +
          (done ? '✓ ' : '○ ') +
          r.label +
          '</li>'
        );
      })
      .join('');
  }

  function panelPose(intensity) {
    if (intensity === 'off') return 'sleep';
    return 'idle';
  }

  function updatePanelAvatar(root, tier, intensity) {
    var img = root.querySelector('[data-casey-panel-avatar]');
    if (!img || !window.CaseyCompanion || !window.CaseyCompanion.setImgPose) return;
    var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
    window.CaseyCompanion.setImgPose(img, assetBase, 'png', tier, panelPose(intensity), {
      alt: 'Casey preview',
    });
    var wrap = root.querySelector('[data-casey-panel-avatar-wrap]');
    if (wrap) wrap.dataset.caseyTier = tier;
  }

  function updatePanelLabels(root, tier) {
    var label = root.querySelector('[data-casey-panel-tier-label]');
    if (label) {
      if (window.CaseyCompanion && window.CaseyCompanion.getInteractions) {
        var cfg = window.CaseyCompanion.getInteractions();
        if (cfg && cfg.tierLabels && cfg.tierLabels[tier]) {
          label.textContent = cfg.tierLabels[tier];
          return;
        }
      }
      label.textContent = TIER_LABELS[tier] || TIER_LABELS.junior;
    }
  }

  function updateProgress(root) {
    var el = root.querySelector('[data-casey-panel-progress]');
    if (!el) return;
    var state = loadState();
    var total = liveTotal();
    var done = liveCompleted(state);
    el.textContent = done + ' of ' + total + ' live cases completed';
  }

  function bindPanel(root) {
    if (!root || root.dataset.caseyPanelBound === '1') return;
    root.dataset.caseyPanelBound = '1';

    var state = loadState();
    var currentTier = window.CasebookTone ? window.CasebookTone.getTone() : 'junior';
    var currentIntensity = state.caseyIntensity || 'full';

    root.querySelectorAll('[data-casey-panel-tier]').forEach(function (btn) {
      var val = btn.getAttribute('data-casey-panel-tier');
      btn.setAttribute('aria-checked', val === currentTier ? 'true' : 'false');
      btn.addEventListener('click', function () {
        if (window.CasebookTone) window.CasebookTone.setTone(val);
      });
    });

    root.querySelectorAll('[data-casey-intensity]').forEach(function (btn) {
      var val = btn.getAttribute('data-casey-intensity');
      btn.setAttribute('aria-checked', val === currentIntensity ? 'true' : 'false');
      btn.addEventListener('click', function () {
        saveIntensity(val);
        root.querySelectorAll('[data-casey-intensity]').forEach(function (b) {
          b.setAttribute('aria-checked', b.getAttribute('data-casey-intensity') === val ? 'true' : 'false');
        });
        updatePanelAvatar(root, window.CasebookTone ? window.CasebookTone.getTone() : currentTier, val);
      });
    });

    var resetBtn = root.querySelector('[data-casey-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!window.confirm('Reset Casey memory and progress on this device?')) return;
        if (window.CaseyCompanion && window.CaseyCompanion.resetCompanion) {
          window.CaseyCompanion.resetCompanion();
        }
        refreshPanel(root);
      });
    }

    refreshPanel(root);
  }

  function syncTriggerAvatar(tier, intensity) {
    var img = document.querySelector('[data-casey-trigger-avatar]');
    if (!img || !window.CaseyCompanion || !window.CaseyCompanion.setImgPose) return;
    var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
    var pose = intensity === 'off' ? 'sleep' : 'idle';
    window.CaseyCompanion.setImgPose(img, assetBase, 'png', tier, pose, { alt: '' });
  }

  function refreshPanel(root) {
    var state = loadState();
    var tier = window.CasebookTone ? window.CasebookTone.getTone() : 'junior';
    var intensity = state.caseyIntensity || 'full';
    updatePanelLabels(root, tier);
    updatePanelAvatar(root, tier, intensity);
    updateProgress(root);
    var list = root.querySelector('[data-casey-milestones]');
    if (list) list.innerHTML = milestoneRows(state);
    root.querySelectorAll('[data-casey-panel-tier]').forEach(function (btn) {
      btn.setAttribute('aria-checked', btn.getAttribute('data-casey-panel-tier') === tier ? 'true' : 'false');
    });
    root.querySelectorAll('[data-casey-intensity]').forEach(function (btn) {
      btn.setAttribute(
        'aria-checked',
        btn.getAttribute('data-casey-intensity') === intensity ? 'true' : 'false'
      );
    });
    syncTriggerAvatar(tier, intensity);
  }

  function wirePanels() {
    document.querySelectorAll('[data-casey-prefs-root]').forEach(bindPanel);
  }

  document.addEventListener('casebook-tone-change', function () {
    document.querySelectorAll('[data-casey-prefs-root]').forEach(refreshPanel);
  });

  document.addEventListener('casey-companion-event', function () {
    document.querySelectorAll('[data-casey-prefs-root]').forEach(refreshPanel);
  });

  function wireCaseyPrefsPopover() {
    var btn = document.getElementById('casebook-prefs-btn');
    var menu = document.getElementById('casebook-prefs-menu');
    if (!btn || !menu || !window.PrefsChrome || !window.PrefsChrome.PopoverMenu) return;
    window.PrefsChrome.PopoverMenu(btn, menu, {
      onOpen: function () {
        wirePanels();
      },
    });
  }

  function boot() {
    wirePanels();
    wireCaseyPrefsPopover();
    if (window.CasebookTone) window.CasebookTone.syncUI();
    var state = loadState();
    syncTriggerAvatar(
      window.CasebookTone ? window.CasebookTone.getTone() : 'junior',
      state.caseyIntensity || 'full'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
