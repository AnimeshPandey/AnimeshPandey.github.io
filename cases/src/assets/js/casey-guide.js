// === casey-guide.js ===
// Reads casebook-companion-v1 progress from localStorage and exposes
// CaseyGuide.suggest(context) to pick a greeting line + pose for Casey.
(function () {
  'use strict';

  var STORAGE_KEY = 'casebook-companion-v1';

  function _loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_) { return {}; }
  }

  function _completedCount(progress) {
    // Support both storage shapes:
    //   caseProgress[slug].completedAt   (new shape)
    //   casesCompleted: [slug, ...]       (legacy shape)
    var cp = progress.caseProgress || {};
    var newCount = Object.keys(cp).filter(function (k) {
      return cp[k] && cp[k].completedAt;
    }).length;
    if (newCount > 0) return newCount;
    var legacy = progress.casesCompleted;
    return Array.isArray(legacy) ? legacy.length : 0;
  }

  function _recentStreak(progress) {
    // Count cases completed in the last 7 days (new shape only).
    var cp = progress.caseProgress || {};
    var cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return Object.keys(cp).filter(function (k) {
      var c = cp[k];
      return c && c.completedAt && new Date(c.completedAt).getTime() > cutoff;
    }).length;
  }

  function _pickLine(lines, vars) {
    if (!lines || !lines.length) return null;
    var item = lines[Math.floor(Math.random() * lines.length)];
    if (!item) return null;
    var line = item.line.replace(/\{(\w+)\}/g, function (_, key) {
      var val = vars[key];
      return val !== undefined && val !== null ? String(val) : '';
    });
    return { pose: item.pose, line: line };
  }

  var CaseyGuide = {
    /**
     * Return { pose, line } for the given context, or null if data isn't ready.
     *
     * context values:
     *   'hub'            — hub page, main greeting
     *   'hub-zero'       — hub page, filter returned zero results
     *   'case-start'     — entering a case for the first time
     *   'case-completed' — user just finished a case
     *   'library'        — library page visit
     */
    suggest: function (context, extraVars) {
      var lines = window.__GUIDE_LINES;
      if (!lines) return null;
      var progress = _loadProgress();
      var completed = _completedCount(progress);
      var streak = _recentStreak(progress);
      var vars = Object.assign({ completed: completed, streak: streak, filtered: '' }, extraVars || {});

      if (context === 'hub') {
        if (completed === 0) return _pickLine(lines.hub.first_visit, vars);
        if (streak >= 3)     return _pickLine(lines.hub.return_streak, vars);
        if (completed >= 10) return _pickLine(lines.hub.return_high, vars);
        return _pickLine(lines.hub.return_low, vars);
      }
      if (context === 'hub-zero')       return _pickLine(lines.hub.zero_results, vars);
      if (context === 'case-start')     return _pickLine(lines.case.start, vars);
      if (context === 'case-completed') return _pickLine(lines.case.completed, vars);
      if (context === 'library')        return _pickLine(lines.library.visit, vars);
      return null;
    },

    /**
     * Dispatch a casey-guide-event custom event so other modules can react.
     * CaseyGuide itself never writes to localStorage — it reads only.
     *
     * type: 'case-started' | 'case-completed'
     */
    recordEvent: function (type) {
      document.dispatchEvent(new CustomEvent('casey-guide-event', { detail: { type: type } }));
    },

    /**
     * Convenience: return a plain summary of the user's current progress.
     */
    getProgress: function () {
      var progress = _loadProgress();
      return {
        completedCount: _completedCount(progress),
        streak: _recentStreak(progress),
        firstVisit: !progress.caseProgress || Object.keys(progress.caseProgress).length === 0
      };
    }
  };

  window.CaseyGuide = CaseyGuide;
})();
