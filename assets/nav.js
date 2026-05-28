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

    /* Reading progress bar */
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

    /* Back to top */
    var backTop = document.getElementById('back-top');
    if (backTop) {
      window.addEventListener('scroll', function () {
        backTop.classList.toggle('visible', window.scrollY > 400);
      }, { passive: true });
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        /* move focus to main for keyboard/screen reader users */
        var main = document.getElementById('main-content') || document.querySelector('main');
        if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
      });
    }

    /* ── Hero: rotating tagline ── */
    var rotateEl = document.querySelector('.hero-rotate');
    if (rotateEl) {
      var rSpans = Array.from(rotateEl.querySelectorAll('span'));
      var rIdx = 0;
      setInterval(function() {
        rSpans[rIdx].classList.remove('active');
        rIdx = (rIdx + 1) % rSpans.length;
        rSpans[rIdx].classList.add('active');
      }, 2800);
    }

    /* ── Hero: spotlight glow + card 3D tilt + float parallax ── */
    /* Only on fine-pointer (mouse) devices without reduced-motion preference */
    (function() {
      var heroEl = document.getElementById('hero');
      var heroCard = document.querySelector('.hero-card');
      var heroFloats = Array.from(document.querySelectorAll('.hero-float'));

      if (!heroEl || !heroCard) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      var rafPending = false;
      var pendingMx = 5, pendingMy = 60;
      var heroReady = false;

      /* Delay card tilt until entrance animation completes */
      setTimeout(function() { heroReady = true; }, 1200);

      function applySpotlight() {
        heroEl.style.setProperty('--mx', pendingMx.toFixed(1) + '%');
        heroEl.style.setProperty('--my', pendingMy.toFixed(1) + '%');
        rafPending = false;
      }

      heroEl.addEventListener('mousemove', function(e) {
        var rect = heroEl.getBoundingClientRect();

        /* Spotlight glow follows cursor */
        pendingMx = (e.clientX - rect.left) / rect.width * 100;
        pendingMy = (e.clientY - rect.top) / rect.height * 100;
        if (!rafPending) { rafPending = true; requestAnimationFrame(applySpotlight); }

        /* Card 3D tilt */
        if (heroReady) {
          var cr = heroCard.getBoundingClientRect();
          var cx = ((e.clientX - cr.left) / cr.width - .5) * 14;
          var cy = ((e.clientY - cr.top) / cr.height - .5) * 10;
          heroCard.style.transform = 'perspective(900px) rotateY(' + cx.toFixed(2) + 'deg) rotateX(' + (-cy).toFixed(2) + 'deg) translateZ(8px)';
        }

        /* Float parallax — larger keywords move more (feel closer) */
        var dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
        var dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
        heroFloats.forEach(function(f) {
          var sz = parseInt(f.style.fontSize, 10) || 30;
          var spd = sz / 2800;
          f.style.transform = 'translate(' + (dx * spd * rect.width).toFixed(1) + 'px,' + (dy * spd * rect.height).toFixed(1) + 'px)';
        });
      });

      heroEl.addEventListener('mouseleave', function() {
        if (heroCard) heroCard.style.transform = '';
        heroFloats.forEach(function(f) { f.style.transform = ''; });
        pendingMx = 5; pendingMy = 60;
        if (!rafPending) { rafPending = true; requestAnimationFrame(applySpotlight); }
      });
    }());

    /* Stats count-up — only when motion is allowed */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches
        && 'IntersectionObserver' in window) {
      var statEls = document.querySelectorAll('.stat-n');
      var statObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          statObs.unobserve(el);
          var original = el.textContent.trim();
          var match = original.match(/^(\d+)(.*)/);
          if (!match) return;
          var endNum = parseInt(match[1], 10);
          var suffix = match[2];
          var dur = 900, startTs = null;
          function tick(ts) {
            if (!startTs) startTs = ts;
            var elapsed = Math.min(ts - startTs, dur);
            var ease = 1 - Math.pow(1 - elapsed / dur, 3); /* cubic ease-out */
            el.textContent = Math.round(ease * endNum) + suffix;
            if (elapsed < dur) requestAnimationFrame(tick);
            else el.textContent = original;
          }
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6, rootMargin: '0px 0px -40px 0px' });
      statEls.forEach(function (el) { statObs.observe(el); });
    }

  });
})();
