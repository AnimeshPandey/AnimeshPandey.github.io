/**
 * casey-hub.js — hub surface; delegates to CaseyCompanion + CaseyGuide.
 */
(function initCaseyHub() {
  if (!document.querySelector('[data-casey-hub]') || !window.CaseyCompanion) return;

  var hubData = {};
  var dataEl = document.getElementById('casey-hub-data');
  if (dataEl) {
    try { hubData = JSON.parse(dataEl.textContent); } catch (e) { /* ignore */ }
  }
  var hubEl = document.querySelector('[data-casey-hub]');

  // Cross-references completed slugs against the hub's own card DOM (each
  // <li data-track> already carries the track, no extra data plumbing
  // needed) to find a track the reader has completed 2+ cases in that
  // still has an unread case sitting on the hub. Lives here rather than
  // in casey-guide.js so that module stays DOM-free — it only ever reads
  // localStorage state, casey-hub.js is what already touches hub markup.
  function trackAffinity(state) {
    // The card grid (#hub-grid) is a sibling of the casey-hub greeting
    // section in the DOM, not a descendant of it — querying from hubEl
    // finds zero cards. Scope to the grid directly instead.
    var grid = document.getElementById('hub-grid');
    var cards = grid ? grid.querySelectorAll('li[data-track]') : [];
    var completed = {};
    (state.casesCompleted || []).forEach(function (s) { completed[s] = true; });
    var doneCounts = {};
    var hasUnread = {};
    cards.forEach(function (li) {
      var track = li.getAttribute('data-track');
      if (!track) return;
      var link = li.querySelector('.case-card__link');
      var href = link && link.getAttribute('href');
      var slug = href ? href.replace(/\/+$/, '').split('/').pop() : null;
      if (!slug) return;
      if (completed[slug]) {
        doneCounts[track] = (doneCounts[track] || 0) + 1;
      } else {
        hasUnread[track] = true;
      }
    });
    var topTrack = null;
    var topCount = 1; // require at least 2 completions in the track to count as an affinity
    Object.keys(doneCounts).forEach(function (t) {
      if (doneCounts[t] > topCount) { topCount = doneCounts[t]; topTrack = t; }
    });
    if (!topTrack || !hasUnread[topTrack]) return null;
    return topTrack.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function tryReviewDueGreeting() {
    var greetEl = document.querySelector('[data-casey-greeting]');
    if (!greetEl) return false;
    var titlesEl = document.getElementById('hub-case-titles');
    var titles = {};
    try { titles = titlesEl ? JSON.parse(titlesEl.textContent) : {}; } catch (e) { /* ignore */ }
    var state = window.CaseyCompanion.getState();
    var reviewSlug = window.CaseyCompanion.pickReviewDueSlug(state.caseProgress, titles);
    if (!reviewSlug) return false;
    var tier =
      document.documentElement.dataset.casebookTone ||
      ((document.querySelector('[data-casey-tier]') || {}).dataset.caseyTier) ||
      'junior';
    var line = window.CaseyCompanion.lineAt('hub.reviewDue', tier, { title: titles[reviewSlug] });
    if (!line) return false;
    greetEl.textContent = line;
    return true;
  }

  window.CaseyCompanion.init({
    surface: 'hub',
    hubData: hubData,
    flagshipSlug: hubEl && hubEl.dataset.flagshipSlug,
  }).then(function () {
    // A due-for-review case is a more specific, more actionable nudge than
    // CaseyGuide's generic streak/first-visit greeting — show it and skip
    // CaseyGuide's own suggestion for this load rather than letting it
    // immediately overwrite the text set here.
    if (tryReviewDueGreeting()) return;
    if (!window.CaseyGuide) return;
    var track = trackAffinity(window.CaseyCompanion.getState());
    var suggestion = CaseyGuide.suggest('hub', track ? { track: track } : undefined);
    if (!suggestion) return;

    var greetEl = document.querySelector('[data-casey-greeting]');
    if (greetEl && suggestion.line) greetEl.textContent = suggestion.line;

    if (suggestion.pose && window.CaseyCompanion.setImgPose) {
      var avatar = document.querySelector('[data-casey-hub-avatar]');
      if (avatar) {
        var assetBase = document.documentElement.dataset.assetBase || '/cases/assets/casey/';
        var tier =
          (document.documentElement.dataset.casebookTone) ||
          ((document.querySelector('[data-casey-tier]') || {}).dataset.caseyTier) ||
          'junior';
        window.CaseyCompanion.setImgPose(avatar, assetBase, 'png', tier, suggestion.pose, {});
      }
    }
  });

  document.addEventListener('casey-hub-filter', function (e) {
    var d = e.detail || {};
    if (!window.CaseyGuide || d.count !== 0 || !d.track) return;
    var zeroPick = CaseyGuide.suggest('hub-zero');
    if (!zeroPick) return;
    var greetEl2 = document.querySelector('[data-casey-greeting]');
    if (greetEl2 && zeroPick.line) greetEl2.textContent = zeroPick.line;
  });
}());
