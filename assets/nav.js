/* nav.js — Layer L3: site chrome (all pages)
   Loads on: all HTML pages
   Exports: none
   Must not: hero effects, canvas, cards, eggs, recruiter panel, contact POST */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var hamburger = document.getElementById('hamburger');
    var mobileNav = document.getElementById('mobile-nav');
    var overlay   = document.getElementById('nav-overlay');
    var closeBtn  = document.getElementById('mobile-nav-close');

    if (!hamburger || !mobileNav) return;

    var focusable = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      mobileNav.classList.add('open');
      overlay && overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      hamburger.setAttribute('aria-expanded', 'true');
      var first = mobileNav.querySelector(focusable);
      if (first) first.focus();
    }

    function closeMenu() {
      mobileNav.classList.remove('open');
      overlay && overlay.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.focus();
    }

    hamburger.addEventListener('click', function () {
      mobileNav.classList.contains('open') ? closeMenu() : openMenu();
    });

    closeBtn && closeBtn.addEventListener('click', closeMenu);
    overlay  && overlay.addEventListener('click', closeMenu);

    mobileNav.querySelectorAll('a[href]').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });

    mobileNav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var els = Array.from(mobileNav.querySelectorAll(focusable)).filter(function (el) {
        return !el.closest('[hidden]') && el.offsetParent !== null;
      });
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-sections__menu a, .mobile-nav-links a');
    function onScroll() {
      var current = '';
      sections.forEach(function (s) {
        if (window.scrollY >= s.offsetTop - 80) current = s.id;
      });
      navLinks.forEach(function (a) {
        var active = a.getAttribute('href') === '#' + current;
        a.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var header = document.querySelector('header');
    if (header) {
      window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 8);
      }, { passive: true });
    }

    var bar = document.querySelector('.progress-bar');
    if (bar) {
      function updateProgress() {
        var total = document.documentElement.scrollHeight - window.innerHeight;
        var pct = total > 0 ? (window.scrollY / total * 100).toFixed(1) + '%' : '0%';
        bar.style.setProperty('--pct', pct);
        bar.setAttribute('aria-valuenow', Math.round(parseFloat(pct)));
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    var backTop = document.getElementById('back-top');
    if (backTop) {
      window.addEventListener('scroll', function () {
        backTop.classList.toggle('visible', window.scrollY > 400);
      }, { passive: true });
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        var main = document.getElementById('main-content') || document.querySelector('main');
        if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
      });
    }

    var yr = document.getElementById('yr');
    if (yr) yr.textContent = String(new Date().getFullYear());

    /* ── Resume preview modal ── */
    (function () {
      var modal    = document.getElementById('resume-preview');
      var closeBtn = modal && modal.querySelector('.resume-modal-close');
      if (!modal) return;

      var lastFocus = null;
      var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

      function openModal() {
        lastFocus = document.activeElement;
        modal.showModal();
        document.body.style.overflow = 'hidden';
        /* Focus close button on open */
        if (closeBtn) closeBtn.focus();
      }

      function closeModal() {
        modal.close();
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
      }

      /* Triggers: hero CTA + header nav button */
      ['resume-preview-trigger', 'nav-resume-preview', 'nav-resume-preview-mobile'].forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', openModal);
      });

      if (closeBtn) closeBtn.addEventListener('click', closeModal);

      /* Click outside (on backdrop) closes */
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });

      /* Escape is handled natively by <dialog>; sync body overflow */
      modal.addEventListener('cancel', function () {
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
      });

      /* Focus trap */
      modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var items = Array.prototype.slice.call(modal.querySelectorAll(FOCUSABLE));
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }());

    /* Desktop Sections dropdown */
    var sectionsBtn = document.getElementById('nav-sections-btn');
    var sectionsMenu = document.getElementById('nav-sections-menu');
    if (sectionsBtn && sectionsMenu && window.PrefsChrome) {
      window.PrefsChrome.PopoverMenu(sectionsBtn, sectionsMenu);
    }
  });
})();
