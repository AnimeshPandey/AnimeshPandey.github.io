/**
 * case-scroll.js — chapter visibility, progress bar; tone via CasebookTone.
 */
(function initCaseScroll() {
  if (!document.querySelector('.case-chapter')) return;

  var prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyTone(tone) {
    if (window.CasebookTone) {
      window.CasebookTone.setTone(tone);
      return;
    }
    /* fallback if casebook-tone.js missing */
    try { localStorage.setItem('casebook-tone', tone); } catch (e) {}
    document.documentElement.dataset.casebookTone = tone;
    document.dispatchEvent(new CustomEvent('casebook-tone-change', { detail: { tone: tone }, bubbles: true }));
  }

  var toneSwitcher = document.getElementById('case-tone-switcher');
  if (toneSwitcher) {
    toneSwitcher.addEventListener('click', function (e) {
      var btn = e.target.closest('.case-tone__btn[data-tone]');
      if (!btn) return;
      applyTone(btn.dataset.tone);
    });
  }

  if (window.CasebookTone) {
    window.CasebookTone.syncUI(window.CasebookTone.getTone());
  }

  var chapters = document.querySelectorAll('.case-chapter');

  if (prm) {
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
    chapters.forEach(function (ch) { ch.classList.add('is-visible'); });
  }

  var progress = document.getElementById('casebook-progress');
  if (progress) {
    var scrollable = document.documentElement;
    var slug = window.location.pathname.split('/').filter(Boolean).pop();
    var progressTimer = null;
    function updateProgress() {
      var total = scrollable.scrollHeight - window.innerHeight;
      var pct = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
      progress.style.transform = 'scaleX(' + pct + ')';
      if (window.CaseyCompanion && window.CaseyCompanion.recordProgress && slug) {
        clearTimeout(progressTimer);
        progressTimer = setTimeout(function () {
          var ch = null;
          document.querySelectorAll('.case-chapter[data-chapter]').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top <= window.innerHeight * 0.35 && r.bottom > 80) ch = el.dataset.chapter;
          });
          window.CaseyCompanion.recordProgress(slug, ch || 'hook', pct);
        }, 400);
      }
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }
}());
