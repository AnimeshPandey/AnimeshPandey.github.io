/**
 * casey-onboarding.js — hub-only, first-visit-only Casey walkthrough.
 *
 * A small sequence of Casey-narrated cards, not DOM-anchored tooltips —
 * anchoring a tour step precisely to a real element (the tone switcher,
 * a specific card) is fragile across viewport sizes and DOM timing; a
 * centered overlay covers the same ground robustly. Persisted via the
 * same dismissedTips mechanism casey-companion.js's initAbout() already
 * uses for its one-shot tip, not a new storage key.
 */
(function initCaseyOnboarding() {
  if (!window.CaseyCompanion) return;

  var TIP_KEY = 'hub-onboarding-tour';
  var state = window.CaseyCompanion.getState ? window.CaseyCompanion.getState() : null;
  if (!state) return;
  if (state.dismissedTips && state.dismissedTips.indexOf(TIP_KEY) !== -1) return;

  // Genuinely first-time only — same check casey-guide.js's getProgress()
  // uses for firstVisit, inlined here rather than depending on that
  // module being loaded (it isn't guaranteed on every page this script
  // could theoretically run on).
  var isFirstVisit = !state.caseProgress || Object.keys(state.caseProgress).length === 0;
  if (!isFirstVisit) return;

  // A quiet/off intensity means the reader has already told Casey to be
  // less present — an unsolicited multi-step overlay on the very first
  // page they see would directly contradict that, even though they can't
  // have set the preference yet on THIS visit (it could carry over from
  // an earlier session that only visited /about/ or /search/ first).
  if (window.CaseyCompanion.shouldShowCaseyBehavior && !window.CaseyCompanion.shouldShowCaseyBehavior('bubble')) return;

  var STEPS = [
    {
      pose: 'wave',
      title: "Hi, I'm Casey",
      body: "I'll leave hints as you read, and I stick around while you explore. This is a two-minute tour of how the site works — skip anytime.",
    },
    {
      pose: 'present',
      title: 'Three reading levels',
      body: 'Every case is written three times — Junior, Mid, and Staff — not just resized. Switch levels inside any case to see the same mechanism explained differently.',
    },
    {
      pose: 'point',
      title: 'Hook, then hands-on',
      body: "Each case opens with a real bug, walks through the fix, then gives you an interactive demo to break and fix yourself — not just a code snippet to read.",
    },
    {
      pose: 'celebrate',
      title: 'Your progress sticks around',
      body: "Completed cases, milestones, and review reminders are all tracked right here in your browser — no account needed. Find me in the header anytime to check in.",
    },
  ];

  var idx = 0;
  var overlay = null;
  var lastFocused = null;

  function assetBase() {
    return document.documentElement.dataset.assetBase || '/cases/assets/casey/';
  }

  function tier() {
    return window.CaseyCompanion.readTier ? window.CaseyCompanion.readTier() : 'junior';
  }

  function dismiss() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKeydown, true);
    var s = window.CaseyCompanion.getState();
    s.dismissedTips = s.dismissedTips || [];
    if (s.dismissedTips.indexOf(TIP_KEY) === -1) s.dismissedTips.push(TIP_KEY);
    window.CaseyCompanion.saveState(s);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function focusableIn(root) {
    return Array.prototype.slice.call(
      root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.hasAttribute('disabled'); });
  }

  function onKeydown(e) {
    if (!overlay) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      dismiss();
      return;
    }
    if (e.key === 'Tab') {
      var items = focusableIn(overlay);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function render() {
    var step = STEPS[idx];
    var isLast = idx === STEPS.length - 1;
    overlay.innerHTML =
      '<div class="casey-onboarding__card" role="dialog" aria-modal="true" aria-labelledby="casey-onboarding-title" tabindex="-1">' +
      '<img class="casey-onboarding__img" src="' + assetBase() + tier() + '/' + step.pose + '.png" width="64" height="64" alt="" />' +
      '<h2 class="casey-onboarding__title" id="casey-onboarding-title"></h2>' +
      '<p class="casey-onboarding__body"></p>' +
      '<div class="casey-onboarding__dots" aria-hidden="true"></div>' +
      '<div class="casey-onboarding__actions">' +
      '<button type="button" class="casey-onboarding__skip">Skip</button>' +
      '<button type="button" class="casey-onboarding__next"></button>' +
      '</div>' +
      '</div>';
    overlay.querySelector('.casey-onboarding__title').textContent = step.title;
    overlay.querySelector('.casey-onboarding__body').textContent = step.body;
    overlay.querySelector('.casey-onboarding__next').textContent = isLast ? 'Start exploring' : 'Next';
    var dots = overlay.querySelector('.casey-onboarding__dots');
    STEPS.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'casey-onboarding__dot' + (i === idx ? ' casey-onboarding__dot--active' : '');
      dots.appendChild(dot);
    });

    overlay.querySelector('.casey-onboarding__skip').addEventListener('click', dismiss);
    overlay.querySelector('.casey-onboarding__next').addEventListener('click', function () {
      if (isLast) { dismiss(); return; }
      idx++;
      render();
    });

    var card = overlay.querySelector('.casey-onboarding__card');
    if (card && card.focus) card.focus();
  }

  function start() {
    lastFocused = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'casey-onboarding__overlay';
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeydown, true);
    render();
  }

  // Let the hub's own init (avatar pose, greeting) settle first so the
  // tour doesn't visually compete with it on first paint.
  setTimeout(start, 600);
}());
