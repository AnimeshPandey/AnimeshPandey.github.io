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
    var rail = document.querySelector('.section-rail');

    /* IntersectionObserver-driven instead of a raw `scroll` listener: a plain
       scroll handler re-reads every section's offsetTop on every scroll
       event, which both thrashes layout and — on real mobile hardware —
       can lag or stall during momentum/inertial scrolling because the
       browser is free to throttle `scroll` event dispatch under load. IO
       callbacks run off that same contention and fire reliably as each
       section crosses the detection band below, so the active indicator
       stays in sync with manual scrolling, not just click-driven jumps. */

    function getTopOffset() {
      var navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '56', 10
      );
      var railH = (rail && rail.offsetHeight > 0) ? rail.offsetHeight : 0;
      return navH + railH + 16;
    }

    var activeId = '';
    var visibleTops = {};
    var observer = null;

    function setActive(id) {
      if (!id || id === activeId) return;
      activeId = id;
      navLinks.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        var hash = href.indexOf('#') >= 0 ? href.substring(href.indexOf('#')) : href;
        a.setAttribute('aria-current', hash === '#' + id ? 'true' : 'false');
      });
      var newHash = '#' + id;
      if (window.location.hash !== newHash) {
        setActiveHash(newHash, true);
      }
    }

    function pickActive() {
      var bestId = '';
      var bestTop = Infinity;
      Object.keys(visibleTops).forEach(function (id) {
        var top = visibleTops[id];
        if (top <= bestTop) { bestTop = top; bestId = id; }
      });
      if (bestId) setActive(bestId);
    }

    function createObserver() {
      if (observer) observer.disconnect();
      visibleTops = {};
      var topOffset = getTopOffset();
      /* Detection band: from just below the sticky header/rail down to the
         vertical mid-point of the viewport — whichever section currently
         occupies that band is "active". Recreated on resize since topOffset
         and the band's percentage split both depend on viewport metrics. */
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visibleTops[entry.target.id] = entry.boundingClientRect.top;
          } else {
            delete visibleTops[entry.target.id];
          }
        });
        pickActive();
      }, { rootMargin: '-' + topOffset + 'px 0px -55% 0px', threshold: [0, 1] });
      sections.forEach(function (s) { observer.observe(s); });
    }

    if (typeof IntersectionObserver !== 'function') {
      /* Ancient-browser fallback: keep the old scroll-listener behavior
         rather than silently dropping scroll-spy entirely. */
      var onScroll = function () {
        var topOffset = getTopOffset();
        var current = '';
        sections.forEach(function (s) {
          if (window.scrollY >= s.offsetTop - topOffset) current = s.id;
        });
        setActive(current);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return;
    }

    createObserver();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(createObserver, 200);
    }, { passive: true });
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

  function initMoreMenu() {
    var moreBtn = document.getElementById('nav-more-btn');
    var moreMenu = document.getElementById('nav-more-menu');
    if (!moreBtn || !moreMenu || !window.PrefsChrome) return;

    window.PrefsChrome.PopoverMenu(moreBtn, moreMenu, {
      onSelect: function (e, ctx) {
        var themeItem = e.target.closest('[data-t]');
        var langItem = e.target.closest('[data-l]');
        if (themeItem) {
          if (typeof window.applyTheme === 'function') window.applyTheme(themeItem.dataset.t);
          ctx.close();
          return;
        }
        if (langItem) {
          if (window.AP_I18N && typeof window.AP_I18N.setLocale === 'function') {
            window.AP_I18N.setLocale(langItem.dataset.l);
          }
          ctx.close();
          return;
        }
        // Resume button (and anything else without data-t/data-l) just closes
        // the menu; its own click handler (initResumeModal) does the rest.
        ctx.close();
      },
      onActivate: function (e, ctx) {
        var active = document.activeElement;
        if (!active || !active.dataset) return;
        if (active.dataset.t) {
          if (typeof window.applyTheme === 'function') window.applyTheme(active.dataset.t);
          ctx.close();
        } else if (active.dataset.l) {
          if (window.AP_I18N && typeof window.AP_I18N.setLocale === 'function') {
            window.AP_I18N.setLocale(active.dataset.l);
          }
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
        /* Lazy iframe src — an eager PDF embed disables back/forward cache for every visit, not just ones that open this modal */
        if (!embed.src && embed.dataset.src) embed.src = embed.dataset.src;
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

    ['resume-preview-trigger', 'nav-resume-preview', 'nav-resume-preview-mobile', 'resume-preview-hc', 'resume-preview-footer'].forEach(function (id) {
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
    initMoreMenu();
    initResumeModal();
    initChromeMisc();
    initHashOnLoad();
  });
})();
