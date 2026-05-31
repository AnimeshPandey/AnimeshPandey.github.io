/* nav.js — Layer L3: site chrome (all pages) */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setActiveHash(hash, replace) {
    if (!hash || hash.charAt(0) !== '#') return;
    var url = hash + window.location.search;
    if (history.replaceState && replace) {
      history.replaceState(null, '', url);
    } else if (history.pushState) {
      history.pushState(null, '', url);
    } else {
      window.location.hash = hash.slice(1);
    }
  }

  function smoothScrollToHash(href, options) {
    options = options || {};
    if (!href || href.charAt(0) !== '#') return false;
    var id = href.slice(1);
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start'
    });
    if (options.updateHash !== false) {
      setActiveHash(href, !!options.replace);
    }
    return true;
  }

  function navigateToHash(href, replace) {
    return smoothScrollToHash(href, { replace: replace, updateHash: true });
  }

  function initMobileDrawer() {
    var hamburger = document.getElementById('hamburger');
    var mobileNav = document.getElementById('mobile-nav');
    var overlay = document.getElementById('nav-overlay');
    var closeBtn = document.getElementById('mobile-nav-close');
    if (!hamburger || !mobileNav) return;

    function openMenu() {
      mobileNav.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      hamburger.setAttribute('aria-expanded', 'true');
      var first = mobileNav.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function closeMenu() {
      mobileNav.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.focus();
    }

    hamburger.addEventListener('click', function () {
      mobileNav.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    mobileNav.querySelectorAll('a[href]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (href && href.indexOf('#') !== -1) {
          var hash = href.indexOf('#') === 0 ? href : href.substring(href.indexOf('#'));
          if (hash.length > 1 && navigateToHash(hash, false)) e.preventDefault();
        }
        closeMenu();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });

    mobileNav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var els = Array.from(mobileNav.querySelectorAll(FOCUSABLE)).filter(function (el) {
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
  }

  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    var navLinks = document.querySelectorAll(
      '.nav-sections__menu a, .mobile-nav-links a, .section-rail a'
    );
    var railOffset = document.querySelector('.section-rail') ? 48 : 0;
    var topOffset = 80 + railOffset;

    function onScroll() {
      var current = '';
      sections.forEach(function (s) {
        if (window.scrollY >= s.offsetTop - topOffset) current = s.id;
      });
      navLinks.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        var hash = href.indexOf('#') >= 0 ? href.substring(href.indexOf('#')) : href;
        var active = hash === '#' + current;
        a.setAttribute('aria-current', active ? 'true' : 'false');
      });
      if (current) {
        var newHash = '#' + current;
        if (window.location.hash !== newHash) {
          setActiveHash(newHash, true);
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initSectionRail() {
    var rail = document.querySelector('.section-rail');
    if (!rail) return;

    rail.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (navigateToHash(href, false)) e.preventDefault();
      });
    });
  }

  function initSectionsDropdown() {
    var sectionsBtn = document.getElementById('nav-sections-btn');
    var sectionsMenu = document.getElementById('nav-sections-menu');
    if (!sectionsBtn || !sectionsMenu || !window.PrefsChrome) return;

    window.PrefsChrome.PopoverMenu(sectionsBtn, sectionsMenu, {
      onSelect: function (e, ctx) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var href = link.getAttribute('href');
        var hash = href.indexOf('#') >= 0 ? href.substring(href.indexOf('#')) : href;
        if (navigateToHash(hash, false)) {
          ctx.close();
        }
      }
    });
  }

  function initHashOnLoad() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    if (!document.getElementById(hash.slice(1))) return;
    requestAnimationFrame(function () {
      smoothScrollToHash(hash, { replace: true, updateHash: true });
    });
  }

  function initResumeModal() {
    var modal = document.getElementById('resume-preview');
    if (!modal) return;

    var closeBtn = modal.querySelector('.resume-modal-close');
    var embed = modal.querySelector('.resume-embed');
    var fallback = modal.querySelector('.resume-embed-fallback');
    var lastFocus = null;

    function showFallback() {
      if (embed) embed.hidden = true;
      if (fallback) fallback.hidden = false;
    }

    function openModal() {
      lastFocus = document.activeElement;
      if (embed && fallback) {
        embed.hidden = false;
        fallback.hidden = true;
        fetch('/resume.pdf', { method: 'HEAD' })
          .then(function (r) { if (!r.ok) showFallback(); })
          .catch(showFallback);
      }
      if (typeof modal.showModal === 'function') modal.showModal();
      else showFallback();
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.close();
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    ['resume-preview-trigger', 'nav-resume-preview', 'nav-resume-preview-mobile'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', openModal);
    });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    modal.addEventListener('cancel', function () {
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    });
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
  }

  function initChromeMisc() {
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
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileDrawer();
    initScrollSpy();
    initSectionRail();
    initSectionsDropdown();
    initResumeModal();
    initChromeMisc();
    initHashOnLoad();
  });
})();
