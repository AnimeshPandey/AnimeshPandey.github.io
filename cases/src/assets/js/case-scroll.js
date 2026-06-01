/**
 * case-scroll.js
 * Owns: tone switcher UI, localStorage(casebook-tone),
 *       chapter IntersectionObserver (.is-visible), progress bar,
 *       dispatches casebook-tone-change event.
 */
(function initCaseScroll() {
  if (!document.querySelector('.case-chapter')) return;

  var TONE_KEY = 'casebook-tone';
  var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Tone management ── */
  function getStoredTone() {
    try { return localStorage.getItem(TONE_KEY) || 'junior'; } catch (e) { return 'junior'; }
  }

  function applyTone(tone) {
    /* Show / hide tone blocks */
    var juniorBlocks = document.querySelectorAll('.tone-junior');
    var midBlocks    = document.querySelectorAll('.tone-mid');
    var staffBlocks  = document.querySelectorAll('.tone-staff');

    juniorBlocks.forEach(function (el) { el.style.display = tone === 'junior' ? 'block' : 'none'; });
    midBlocks.forEach(function (el)    { el.style.display = tone === 'mid'    ? 'block' : 'none'; });
    staffBlocks.forEach(function (el)  { el.style.display = tone === 'staff'  ? 'block' : 'none'; });

    /* Update tone buttons aria-pressed */
    var btns = document.querySelectorAll('.case-tone__btn[data-tone]');
    btns.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.tone === tone ? 'true' : 'false');
    });

    /* Persist + document hook for CSS/telemetry */
    try { localStorage.setItem(TONE_KEY, tone); } catch (err) {}
    document.documentElement.dataset.casebookTone = tone;

    /* Dispatch event */
    document.dispatchEvent(new CustomEvent('casebook-tone-change', {
      detail: { tone: tone },
      bubbles: true,
    }));
  }

  /* ── 2. Wire tone buttons ── */
  var toneSwitcher = document.getElementById('case-tone-switcher');
  if (toneSwitcher) {
    toneSwitcher.addEventListener('click', function (e) {
      var btn = e.target.closest('.case-tone__btn[data-tone]');
      if (!btn) return;
      applyTone(btn.dataset.tone);
    });
  }

  /* Apply stored tone on load */
  applyTone(getStoredTone());

  /* ── 3. Chapter IntersectionObserver ── */
  var chapters = document.querySelectorAll('.case-chapter');

  if (prm) {
    /* PRM: show all immediately, no animation */
    chapters.forEach(function (ch) { ch.classList.add('is-visible'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    chapters.forEach(function (ch) { io.observe(ch); });
  } else {
    /* No IO support — show all */
    chapters.forEach(function (ch) { ch.classList.add('is-visible'); });
  }

  /* ── 4. Progress bar ── */
  var progress = document.getElementById('casebook-progress');
  if (progress) {
    var scrollable = document.documentElement;
    function updateProgress() {
      var total = scrollable.scrollHeight - window.innerHeight;
      var pct = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
      progress.style.transform = 'scaleX(' + pct + ')';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

}());
