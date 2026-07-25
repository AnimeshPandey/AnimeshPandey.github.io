/**
 * casebook-interview.js — two roles depending on the page it loads on:
 *
 * 1. On /cases/interview/: wires the setup form (track + count), builds a
 *    session from the embedded live-case list, saves it, and redirects to
 *    the first case. Also renders the session summary when returning here
 *    with ?done=1.
 * 2. On any case page reached with ?interview=<sessionId> matching a saved
 *    session: hides the Casey coach (hints) behind a reveal toggle, shows
 *    an "Interview: case N of M" banner, and listens for the existing
 *    case-case-completed event (already dispatched by casey-companion.js's
 *    takeaway-chapter scroll detection — no new detection logic needed
 *    here) to prompt a self-assessment and advance to the next case in
 *    the session, or the summary once the last one is done.
 *
 * Session shape, stored via CasebookProgressStore under
 * casebook-interview-v1:
 *   { id, startedAt, track, count, caseSlugs: [...], results: { slug: 'yes'|'partial'|'no' } }
 */
(function initCasebookInterview() {
  'use strict';

  var STORAGE_KEY = 'casebook-interview-v1';
  var pathPrefix = document.documentElement.dataset.pathPrefix || '/cases/';
  var store = window.CasebookProgressStore || {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };

  function loadSession() {
    try {
      var raw = store.get(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveSession(session) {
    store.set(STORAGE_KEY, JSON.stringify(session));
  }

  function buildSessionId() {
    return 'session-' + Math.random().toString(36).slice(2, 10);
  }

  function shuffle(arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  // ── Role 1: setup page ──────────────────────────────────────────────
  var setupForm = document.getElementById('interview-setup');
  if (setupForm) {
    var liveCasesEl = document.getElementById('interview-live-cases');
    var liveCases = [];
    try { liveCases = liveCasesEl ? JSON.parse(liveCasesEl.textContent) : []; } catch (e) { /* ignore */ }

    var params = new URLSearchParams(window.location.search);
    var summaryEl = document.getElementById('interview-summary');

    function renderSummary() {
      var sessionId = params.get('session');
      var session = loadSession();
      if (!sessionId || !session || session.id !== sessionId) return false;

      var metaEl = document.getElementById('interview-summary-meta');
      var listEl = document.getElementById('interview-summary-list');
      var results = session.results || {};
      var total = session.caseSlugs.length;
      var answered = Object.keys(results).length;
      if (metaEl) {
        metaEl.textContent = answered + ' of ' + total + ' cases self-assessed.';
      }
      if (listEl) {
        listEl.innerHTML = session.caseSlugs.map(function (slug) {
          var result = results[slug];
          var label = result === 'yes' ? 'Got it' : result === 'partial' ? 'Partial' : result === 'no' ? 'Needs review' : 'Not reached';
          return '<li><div class="casebook-search__result"><span class="casebook-search__result-title">' + slug + '</span><span class="casebook-search__result-meta">' + label + '</span></div></li>';
        }).join('');
      }
      setupForm.hidden = true;
      if (summaryEl) summaryEl.hidden = false;
      return true;
    }

    if (!renderSummary()) {
      setupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var track = document.getElementById('interview-track').value;
        var countRaw = document.getElementById('interview-count').value;
        var errorEl = document.getElementById('interview-setup-error');

        var pool = track ? liveCases.filter(function (c) { return c.track === track; }) : liveCases.slice();
        if (!pool.length) {
          if (errorEl) { errorEl.hidden = false; errorEl.textContent = 'No live cases in that track yet.'; }
          return;
        }
        var shuffled = shuffle(pool);
        var count = countRaw === 'all' ? shuffled.length : Math.min(Number(countRaw) || 5, shuffled.length);
        var caseSlugs = shuffled.slice(0, count).map(function (c) { return c.slug; });

        var session = {
          id: buildSessionId(),
          startedAt: new Date().toISOString(),
          track: track || 'mixed',
          count: count,
          caseSlugs: caseSlugs,
          results: {},
        };
        saveSession(session);
        window.location.href = pathPrefix + caseSlugs[0] + '/?interview=' + session.id;
      });
    }
    return; // setup-page role only; the case-page role below doesn't apply here
  }

  // ── Role 2: case page in an active interview session ───────────────
  var params2 = new URLSearchParams(window.location.search);
  var sessionId = params2.get('interview');
  if (!sessionId) return;

  var session = loadSession();
  if (!session || session.id !== sessionId) return;

  var demoEl = document.querySelector('[data-demo-slug]');
  var currentSlug = demoEl ? demoEl.dataset.demoSlug : null;
  var idx = session.caseSlugs.indexOf(currentSlug);
  if (!currentSlug || idx === -1) return; // not a case page, or not part of this session

  document.documentElement.classList.add('casebook-interview-active');

  // Two separate elements, not one: a static banner (case counter + hint
  // toggle) inserted in normal flow below the site's own sticky header,
  // and a viewport-fixed bottom bar for the self-assessment prompt.
  // Originally these were one sticky-top banner — that put the assessment
  // buttons underneath the header's own sticky stack (confirmed via
  // elementFromPoint: clicks landed on the header instead). Removing
  // `position: sticky` fixed that but broke it a different way: once the
  // user has scrolled down to the takeaway chapter to trigger the prompt,
  // a top-anchored banner has scrolled off-screen with them and is no
  // longer reachable at all. A fixed bottom bar is visible regardless of
  // scroll position, which is also where a "did you get this?" prompt
  // belongs UX-wise — right where the user's attention already is.
  // Self-assessment is reached via an explicit "I'm done with this case"
  // button, not solely by listening for casey-companion.js's
  // case-case-completed event (dispatched 2s after the takeaway chapter
  // is scroll-detected). That event is a legitimate bonus trigger — most
  // users who read to the end will scroll past takeaway naturally — but
  // it depends on an IntersectionObserver + timer chain outside this
  // feature's control, and isn't guaranteed to fire for every reading
  // pattern (e.g. jumping straight to takeaway via a link, or a browser/
  // viewport combination where the chapter never crosses the 30%
  // intersection threshold this repo's own e2e suite requires isn't
  // solely relied upon either — see casebook-case.spec.ts, which only
  // asserts casesStarted, not casesCompleted, after the same scroll).
  // A manual button is a hard guarantee: it works regardless of scroll
  // mechanics, and gives the user control over exactly when they're
  // ready to self-assess rather than a fixed 2-second guess.
  var banner = document.createElement('div');
  banner.className = 'casebook-interview-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Interview mode');
  banner.innerHTML =
    '<span class="casebook-interview-banner__label">Interview: case ' + (idx + 1) + ' of ' + session.caseSlugs.length + '</span>' +
    '<button type="button" class="casebook-interview-banner__reveal" id="casebook-interview-reveal">Show hints</button>' +
    '<button type="button" class="casebook-interview-banner__done" id="casebook-interview-done">I’m done with this case</button>';
  var progressBar = document.getElementById('casebook-progress');
  if (progressBar && progressBar.parentNode) {
    progressBar.parentNode.insertBefore(banner, progressBar);
  } else {
    document.body.insertBefore(banner, document.body.firstChild);
  }

  var assessBar = document.createElement('div');
  assessBar.className = 'casebook-interview-assess';
  assessBar.id = 'casebook-interview-assess';
  assessBar.setAttribute('role', 'region');
  assessBar.setAttribute('aria-label', 'Self-assessment');
  assessBar.hidden = true;
  assessBar.innerHTML =
    '<span>How did that go?</span>' +
    '<button type="button" data-result="yes">Got it</button>' +
    '<button type="button" data-result="partial">Partial</button>' +
    '<button type="button" data-result="no">Need review</button>';
  document.body.appendChild(assessBar);

  var revealBtn = document.getElementById('casebook-interview-reveal');
  if (revealBtn) {
    revealBtn.addEventListener('click', function () {
      var revealed = document.documentElement.classList.toggle('casebook-interview-hints-shown');
      revealBtn.textContent = revealed ? 'Hide hints' : 'Show hints';
    });
  }

  function advance(result) {
    session.results[currentSlug] = result;
    saveSession(session);
    var nextIdx = idx + 1;
    if (nextIdx < session.caseSlugs.length) {
      window.location.href = pathPrefix + session.caseSlugs[nextIdx] + '/?interview=' + session.id;
    } else {
      window.location.href = pathPrefix + 'interview/?session=' + session.id + '&done=1';
    }
  }

  var assessWired = false;
  var advanced = false;

  function revealAssessment() {
    if (assessWired) return;
    assessWired = true;
    assessBar.hidden = false;
    var doneBtn = document.getElementById('casebook-interview-done');
    if (doneBtn) doneBtn.hidden = true;
    assessBar.querySelectorAll('button[data-result]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (advanced) return;
        advanced = true;
        advance(btn.dataset.result);
      });
    });
  }

  var doneBtn = document.getElementById('casebook-interview-done');
  if (doneBtn) doneBtn.addEventListener('click', revealAssessment);

  // Bonus auto-trigger — fires revealAssessment() early if the user
  // naturally scrolls to takeaway and casey-companion.js's own detection
  // completes, saving them the extra click. Guarded by the same
  // assessWired flag, so whichever trigger (button or scroll) happens
  // first wins and the other becomes a no-op.
  document.addEventListener('case-case-completed', revealAssessment);
}());
