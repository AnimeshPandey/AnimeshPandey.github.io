/* Mobile nav — hamburger, focus trap, scroll-spy */
(function () {
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

    /* Close on nav link click */
    mobileNav.querySelectorAll('a[href]').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    /* Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });

    /* Focus trap */
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

    /* Scroll-spy */
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
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

    /* Sticky header shadow */
    var header = document.querySelector('header');
    if (header) {
      window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 8);
      }, { passive: true });
    }
  });
})();
