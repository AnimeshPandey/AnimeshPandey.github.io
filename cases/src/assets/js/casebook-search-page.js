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
  var count = document.getElementById('casebook-search-count');
  if (!input || !list || !window.CasebookSearch) return;

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
    if (!query) {
      list.innerHTML = '';
      empty.hidden = true;
      count.textContent = '';
      return;
    }
    if (!results.length) {
      list.innerHTML = '';
      empty.hidden = false;
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
