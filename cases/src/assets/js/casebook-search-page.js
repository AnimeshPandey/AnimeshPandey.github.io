/**
 * casebook-search-page.js — wires the /search/ page's input to
 * window.CasebookSearch (casebook-search.js, loaded first) and renders
 * results. Debounced so fast typing doesn't re-score the whole index on
 * every keystroke.
 */
(function initCasebookSearchPage() {
  'use strict';

  var input = document.getElementById('casebook-search-input');
  var list = document.getElementById('casebook-search-results');
  var empty = document.getElementById('casebook-search-empty');
  var emptyMsg = empty ? empty.querySelector('.hub-empty__msg') : null;
  var count = document.getElementById('casebook-search-count');
  if (!input || !list || !window.CasebookSearch) return;

  function caseyLine(path, vars) {
    if (!window.CaseyCompanion || !window.CaseyCompanion.lineAt) return '';
    var tier = window.CaseyCompanion.readTier ? window.CaseyCompanion.readTier() : 'junior';
    return window.CaseyCompanion.lineAt(path, tier, vars) || '';
  }

  // Track-affinity bubble shown before the reader has typed anything —
  // same "2+ completions in a track with an unread case still there"
  // signal casey-hub.js's greeting uses, but computed from the embedded
  // liveCases list directly instead of hub card DOM (this page has no
  // card grid to query).
  function renderIdleBubble() {
    var bubbleEl = document.getElementById('search-casey-bubble');
    if (!bubbleEl || !window.CaseyCompanion) return;
    if (window.CaseyCompanion.shouldShowCaseyBehavior && !window.CaseyCompanion.shouldShowCaseyBehavior('bubble')) return;
    var liveEl = document.getElementById('search-live-cases');
    var live = [];
    try { live = liveEl ? JSON.parse(liveEl.textContent) : []; } catch (e) { /* ignore */ }
    var state = window.CaseyCompanion.getState ? window.CaseyCompanion.getState() : { casesCompleted: [] };
    var completed = {};
    (state.casesCompleted || []).forEach(function (s) { completed[s] = true; });

    var doneCounts = {};
    var unreadByTrack = {};
    live.forEach(function (c) {
      if (completed[c.slug]) {
        doneCounts[c.track] = (doneCounts[c.track] || 0) + 1;
      } else if (!unreadByTrack[c.track]) {
        unreadByTrack[c.track] = c; // first unread case in that track
      }
    });
    var topTrack = null;
    var topCount = 1;
    Object.keys(doneCounts).forEach(function (t) {
      if (doneCounts[t] > topCount) { topCount = doneCounts[t]; topTrack = t; }
    });

    var text;
    if (topTrack && unreadByTrack[topTrack]) {
      var trackLabelText = topTrack.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      text = caseyLine('search.trackAffinity', { track: trackLabelText, title: unreadByTrack[topTrack].title });
    }
    if (!text) text = caseyLine('search.idle');
    if (!text) return;

    bubbleEl.innerHTML =
      '<div class="casey-about-bubble" role="note">' +
      '<img class="casey-about-bubble__img" src="' +
      (document.documentElement.dataset.assetBase || '/cases/assets/casey/') +
      (window.CaseyCompanion.readTier ? window.CaseyCompanion.readTier() : 'junior') +
      '/curious.png" width="64" height="64" alt="" />' +
      '<p class="casey-about-bubble__text"></p>' +
      '</div>';
    bubbleEl.querySelector('.casey-about-bubble__text').textContent = text;
  }
  renderIdleBubble();

  var TRACK_LABELS = {}; // populated lazily from data-track-label attrs if present

  function trackLabel(track) {
    if (!track) return '';
    return track.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function resultItemHTML(doc) {
    if (doc.type === 'case') {
      if (doc.status === 'live' && doc.url) {
        return (
          '<a class="casebook-search__result" href="' + doc.url + '">' +
          '<span class="casebook-search__result-title">' + escapeHTML(doc.title) + '</span>' +
          '<span class="casebook-search__result-meta">' + escapeHTML(trackLabel(doc.track)) + ' &middot; Case</span>' +
          '</a>'
        );
      }
      return (
        '<div class="casebook-search__result casebook-search__result--planned">' +
        '<span class="casebook-search__result-title">' + escapeHTML(doc.title) + '</span>' +
        '<span class="casebook-search__result-meta">' + escapeHTML(trackLabel(doc.track)) + ' &middot; Planned, not yet published</span>' +
        '</div>'
      );
    }
    // library entry
    if (doc.url) {
      return (
        '<a class="casebook-search__result" href="' + doc.url + '" rel="noopener noreferrer">' +
        '<span class="casebook-search__result-title">' + escapeHTML(doc.title) + '</span>' +
        '<span class="casebook-search__result-meta">' + escapeHTML(doc.company || '') + ' &middot; Reading library</span>' +
        '</a>'
      );
    }
    return (
      '<div class="casebook-search__result">' +
      '<span class="casebook-search__result-title">' + escapeHTML(doc.title) + '</span>' +
      '<span class="casebook-search__result-meta">' + escapeHTML(doc.company || '') + ' &middot; Reading library</span>' +
      '</div>'
    );
  }

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(results, query) {
    var bubbleEl = document.getElementById('search-casey-bubble');
    if (bubbleEl) bubbleEl.hidden = !!query; // idle suggestion only makes sense before a real search is active

    if (!query) {
      list.innerHTML = '';
      empty.hidden = true;
      count.textContent = '';
      return;
    }
    if (!results.length) {
      list.innerHTML = '';
      empty.hidden = false;
      if (emptyMsg) {
        emptyMsg.textContent = caseyLine('search.zeroResults', { query: query }) || 'Nothing matches that search.';
      }
      count.textContent = 'No results for "' + query + '"';
      return;
    }
    empty.hidden = true;
    count.textContent = results.length + ' result' + (results.length === 1 ? '' : 's') + ' for "' + query + '"';
    list.innerHTML = results.map(function (r) {
      return '<li>' + resultItemHTML(r.doc) + '</li>';
    }).join('');
  }

  var debounceTimer = null;
  function onInput() {
    var query = input.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      window.CasebookSearch.search(query).then(function (results) {
        render(results, query.trim());
      });
    }, 120);
  }

  input.addEventListener('input', onInput);

  // Support ?q= deep links (e.g. from the header trigger).
  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get('q');
  if (initialQuery) {
    input.value = initialQuery;
    onInput();
  }
}());
