// === chapter-progress.js ===
(function () {
  'use strict';

  // Only run on case pages (pages with .case-chapter elements)
  var chapters = document.querySelectorAll('.case-chapter[data-chapter]');
  if (chapters.length < 3) return; // not a case page

  // Chapters to track (in order of appearance, max 5 meaningful ones)
  var TRACK_NAMES = { 'hook': 'Intro', 'concept': 'Concept', 'story-1': 'Story',
    'story': 'Story', 'demo': 'Demo', 'fe-depth': 'Depth',
    'references': 'Refs', 'takeaway': 'Takeaway' };

  // Pick up to 5 chapters to show dots for
  var tracked = [];
  chapters.forEach(function (el) {
    var name = el.dataset.chapter;
    if (TRACK_NAMES[name] && tracked.length < 5) {
      tracked.push({ el: el, name: TRACK_NAMES[name] });
    }
  });
  if (tracked.length < 2) return;

  // Build the dot nav DOM
  var nav = document.createElement('nav');
  nav.className = 'chapter-progress';
  nav.setAttribute('aria-label', 'Case progress');
  nav.innerHTML = tracked.map(function (t, i) {
    return '<button class="chapter-progress__dot" aria-label="Go to ' + t.name + '" data-idx="' + i + '" title="' + t.name + '"></button>';
  }).join('');

  // Insert after the case header (before first chapter)
  var firstChapter = chapters[0];
  firstChapter.parentNode.insertBefore(nav, firstChapter);

  // Activate dot on click
  nav.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-idx]');
    if (!btn) return;
    tracked[+btn.dataset.idx].el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // IntersectionObserver to activate current dot
  var dots = nav.querySelectorAll('.chapter-progress__dot');
  var active = 0;

  function setActive(i) {
    dots[active].classList.remove('chapter-progress__dot--active');
    active = i;
    dots[active].classList.add('chapter-progress__dot--active');
  }
  setActive(0);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      tracked.forEach(function (t, i) {
        if (t.el === entry.target) setActive(i);
      });
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  tracked.forEach(function (t) { io.observe(t.el); });
})();
