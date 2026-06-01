/**
 * casebook-progression.js — live completion counts + progress UI.
 */
(function initCasebookProgression() {
  'use strict';

  function readLiveTotal() {
    var bar = document.querySelector('[data-casebook-progress-bar]');
    if (bar && bar.getAttribute('aria-valuemax')) {
      return parseInt(bar.getAttribute('aria-valuemax'), 10) || 31;
    }
    return 31;
  }

  function getCompanionState() {
    if (window.CaseyCompanion && window.CaseyCompanion.getState) {
      return window.CaseyCompanion.getState();
    }
    try {
      var raw = localStorage.getItem('casebook-companion-v1');
      return raw ? JSON.parse(raw) : { casesCompleted: [] };
    } catch (e) {
      return { casesCompleted: [] };
    }
  }

  function liveCompletedCount(state) {
    var completed = state.casesCompleted || [];
    var liveSlugs = readLiveSlugs();
    if (!liveSlugs.length) return completed.length;
    return completed.filter(function (slug) {
      return liveSlugs.indexOf(slug) !== -1;
    }).length;
  }

  function readLiveSlugs() {
    var el = document.getElementById('hub-live-cases');
    if (!el) return [];
    try {
      var d = JSON.parse(el.textContent);
      return (d.cases || []).map(function (c) { return c.slug; });
    } catch (e) {
      return [];
    }
  }

  function updateProgressUI() {
    var state = getCompanionState();
    var total = readLiveTotal();
    var done = liveCompletedCount(state);
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    document.querySelectorAll('[data-casebook-progress-bar]').forEach(function (bar) {
      bar.setAttribute('aria-valuenow', String(done));
      bar.setAttribute('aria-valuemax', String(total));
    });

    document.querySelectorAll('[data-casebook-progress-fill]').forEach(function (fill) {
      fill.style.width = pct + '%';
    });

    document.querySelectorAll('[data-casebook-progress-meta]').forEach(function (meta) {
      meta.textContent =
        done + ' of ' + total + ' live cases completed' +
        (done >= 5 ? ' — past tourist mode.' : done >= 1 ? ' — nice start.' : '');
    });

    document.querySelectorAll('[data-casebook-progress-count]').forEach(function (el) {
      el.textContent = String(done);
    });

    document.querySelectorAll('[data-casebook-progress-strip]').forEach(function (strip) {
      strip.hidden = false;
    });

    var hint = document.querySelector('[data-casebook-progress-hint]');
    if (hint) {
      if (done === 0 && state.lastSlug) {
        hint.hidden = false;
        hint.textContent = 'You have a case in progress — Casey will surface Continue on the hub.';
      } else if (done > 0 && done < total) {
        hint.hidden = false;
        hint.textContent = 'Keep your streak — finish takeaways to count a case complete.';
      } else if (done >= total) {
        hint.hidden = false;
        hint.textContent = 'You cleared every live case. Upcoming cases are in the hub filter.';
      } else {
        hint.hidden = true;
      }
    }

    var accountStats = document.getElementById('account-stats');
    if (accountStats) {
      accountStats.innerHTML =
        '<p><strong>' + done + '</strong> / ' + total + ' live cases completed</p>' +
        '<p>' + (state.casesStarted || []).length + ' started · tone: ' + (state.tone || 'junior') + '</p>';
    }
  }

  function onCaseCompleted(e) {
    var section = document.getElementById('case-continue');
    if (!section) return;
    section.classList.add('case-continue--completed');
    var lead = section.querySelector('[data-case-continue-lead]');
    if (lead) {
      lead.textContent = 'Case complete — jump to the next one while the pattern is fresh.';
    }
    var nextBtn = section.querySelector('[data-case-continue-next]');
    if (nextBtn) nextBtn.classList.add('case-continue__btn--pulse');
    updateProgressUI();
  }

  function boot() {
    updateProgressUI();
    document.addEventListener('case-case-completed', onCaseCompleted);
    document.addEventListener('casebook-auth-change', updateProgressUI);
    if (window.CaseyCompanion) {
      var orig = window.CaseyCompanion.recordEvent;
      if (orig && !window.CaseyCompanion.__progressionHook) {
        window.CaseyCompanion.__progressionHook = true;
        window.CaseyCompanion.recordEvent = function (type, detail) {
          var r = orig.call(window.CaseyCompanion, type, detail);
          if (type === 'case-completed' || type === 'case-started') {
            setTimeout(updateProgressUI, 50);
          }
          return r;
        };
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.CasebookProgression = { update: updateProgressUI };
}());
