/**
 * casebook-search.js — hand-rolled client-side search over the ~1,000
 * short documents in search-index.json (229 cases + 779 library entries).
 * No search library — this codebase ships zero client-side npm
 * dependencies (every assets/js/*.js file is hand-written, loaded via
 * plain <script> tags, no bundler), and at this corpus size a simple
 * scored substring match is more than fast enough without one.
 */
(function initCasebookSearch() {
  'use strict';

  var INDEX_URL = '/cases/assets/search-index.json';
  var indexPromise = null;

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL)
        .then(function (res) { return res.ok ? res.json() : { cases: [], library: [] }; })
        .catch(function () { return { cases: [], library: [] }; });
    }
    return indexPromise;
  }

  function normalize(s) {
    return (s || '').toLowerCase();
  }

  /**
   * Scores a single document against a normalized query. Title match
   * outranks track match outranks company/principle match; live cases
   * outrank idea-status ones so a searcher sees what they can actually
   * open first.
   */
  function scoreDoc(doc, q) {
    var title = normalize(doc.title);
    var track = normalize(doc.track);
    var extra = normalize(doc.principle || doc.company || '');
    var score = 0;

    if (title === q) score += 100;
    else if (title.indexOf(q) === 0) score += 60;
    else if (title.indexOf(q) !== -1) score += 40;

    if (track.indexOf(q) !== -1) score += 15;
    if (extra.indexOf(q) !== -1) score += 10;

    if (score > 0 && doc.type === 'case' && doc.status === 'live') score += 5;
    return score;
  }

  /**
   * search(query, { limit }) -> Promise<Array<{doc, score}>>, sorted
   * highest score first. Empty/whitespace query resolves to [].
   */
  function search(query, opts) {
    opts = opts || {};
    var limit = opts.limit || 20;
    var q = normalize(query).trim();
    if (!q) return Promise.resolve([]);

    return loadIndex().then(function (idx) {
      var all = (idx.cases || []).concat(idx.library || []);
      var scored = all
        .map(function (doc) { return { doc: doc, score: scoreDoc(doc, q) }; })
        .filter(function (r) { return r.score > 0; })
        .sort(function (a, b) { return b.score - a.score; });
      return scored.slice(0, limit);
    });
  }

  window.CasebookSearch = { search: search, loadIndex: loadIndex };
}());
