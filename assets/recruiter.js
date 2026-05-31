/**
 * recruiter.js — Recruiter Briefing Panel orchestrator.
 * Lazy-loaded on first recruiter mode activation.
 *
 * Exports: window.RecruiterBriefing = { open, close, toggle, isOpen, isActive }
 *
 * How to test:
 *   - Direct URL: https://anmshpndy.com/?recruiter=1
 *   - localStorage: localStorage.setItem('recruiter', '1') then reload
 *   - Click "Recruiter briefing" toggle in hero or footer
 */
(function () {
  'use strict';

  var d = document;
  var brief = window.__RECRUITER_BRIEF || {};
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── State ── */
  var _isOpen      = false;
  var _isActive    = false;          // recruiter mode on
  var _lastToggle  = null;           // element to restore focus to
  var _sessionId   = 0;              // incremented on each open() to cancel stale animations
  var _lastRenderMs = 0;             // R9: timestamp of last completed render (for cache TTL)

  /* ── DOM refs ── */
  var panel    = d.getElementById('rm-panel');
  var backdrop = panel && panel.querySelector('.rm-panel-backdrop');
  var sheet    = panel && panel.querySelector('.rm-panel-sheet');
  var scanEl   = d.getElementById('rm-scan');
  var bodyEl   = d.getElementById('rm-body');
  var closeBtn = d.getElementById('rm-panel-close');
  var minBtn   = d.getElementById('rm-panel-minimize');
  var copyBtn  = d.getElementById('rm-copy-brief');

  if (!panel || !scanEl || !bodyEl) return; // guard — wrong page

  /* ════════════════════════════════════════════════
     OPEN / CLOSE
  ════════════════════════════════════════════════ */
  function open(fromToggle) {
    if (_isOpen) return;
    _isOpen     = true;
    _isActive   = true;
    _sessionId += 1;
    if (fromToggle) _lastToggle = fromToggle;

    // Activate recruiter mode page effects
    d.body.classList.add('recruiter-mode');
    try { localStorage.setItem('recruiter', '1'); } catch (e) {}
    syncToggles(true);

    // Show panel
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');
    d.body.classList.add('rm-panel-open');

    requestAnimationFrame(function () {
      panel.classList.add('rm-panel-visible');
    });

    // Update URL
    if (history.pushState) {
      var url = new URL(location.href);
      url.searchParams.set('recruiter', '1');
      history.replaceState(null, '', url.toString());
    }

    // R9: Reuse in-memory cached render if panel was closed within 2 minutes
    var CACHE_TTL_MS = 120000; // 2 min
    var canUseCached = _lastRenderMs > 0 &&
                       (Date.now() - _lastRenderMs) < CACHE_TTL_MS &&
                       bodyEl && bodyEl.children.length > 0;

    if (canUseCached) {
      // Content still live in DOM — scroll to top and show instantly
      if (bodyEl) bodyEl.scrollTop = 0;
    } else {
      // Full clear + re-render
      if (bodyEl) { bodyEl.scrollTop = 0; bodyEl.innerHTML = ''; }
      if (scanEl) { scanEl.innerHTML = ''; scanEl.classList.remove('rm-scan-done'); }

      if (reducedMotion) {
        renderAllImmediate();
      } else {
        runPhases(_sessionId);
      }
    }

    // Close any open egg overlays before showing panel (avoid stacked modals)
    if (window.Eggs && window.Eggs.closeAll) window.Eggs.closeAll();

    // Trap focus
    trapFocus();
  }

  function close() {
    if (!_isOpen) return;
    _isOpen     = false;
    _sessionId += 1; // cancel in-flight animations

    panel.classList.remove('rm-panel-visible');
    d.body.classList.remove('rm-panel-open');

    // Clean URL
    if (history.replaceState) {
      var url = new URL(location.href);
      url.searchParams.delete('recruiter');
      history.replaceState(null, '', url.toString());
    }

    // Wait for slide animation, then hide
    setTimeout(function () {
      if (!_isOpen) {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
      }
    }, 380);

    releaseFocus();

    // Restore focus to trigger element
    if (_lastToggle && _lastToggle.focus) {
      setTimeout(function () { _lastToggle.focus(); }, 50);
    }
  }

  function toggle(fromToggle) {
    if (_isOpen) close(); else open(fromToggle);
  }

  /* ════════════════════════════════════════════════
     THREE-PHASE ANIMATION
  ════════════════════════════════════════════════ */
  function runPhases(sid) {
    runPhase1(sid, function () {
      runPhase2(sid, function () {
        runPhase3(sid);
      });
    });
  }

  /* Phase 1 — scan checklist (200ms per step) */
  function runPhase1(sid, done) {
    var steps = brief.scanSteps || [];

    scanEl.innerHTML = '';
    var title = d.createElement('p');
    title.className = 'rm-scan-title';
    title.setAttribute('aria-hidden', 'true');
    title.textContent = 'Scanning profile…';
    scanEl.appendChild(title);

    var ul = d.createElement('ul');
    ul.className = 'rm-scan-steps';
    ul.setAttribute('aria-hidden', 'true');

    var items = steps.map(function (step) {
      var li = d.createElement('li');
      li.className = 'rm-scan-step';
      li.innerHTML =
        '<span class="rm-step-icon" aria-hidden="true">◯</span>' +
        '<span class="rm-step-label">' + esc(step.label) + '</span>';
      ul.appendChild(li);
      return li;
    });
    scanEl.appendChild(ul);

    var spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    var spinIndex = 0;
    var spinTimer = null;

    function activateStep(i) {
      if (i >= items.length) {
        clearInterval(spinTimer);
        // Announce to screen readers
        var liveMsg = d.createElement('span');
        liveMsg.className = 'visually-hidden';
        liveMsg.textContent = 'Profile scan complete.';
        scanEl.appendChild(liveMsg);
        setTimeout(function () { if (sid === _sessionId) collapseScan(done); }, 200);
        return;
      }
      if (sid !== _sessionId) return;

      var el = items[i];
      el.classList.add('rm-step-active');
      var icon = el.querySelector('.rm-step-icon');

      clearInterval(spinTimer);
      spinTimer = setInterval(function () {
        if (sid !== _sessionId) { clearInterval(spinTimer); return; }
        icon.textContent = spinChars[spinIndex % spinChars.length];
        spinIndex++;
      }, 80);

      setTimeout(function () {
        if (sid !== _sessionId) { clearInterval(spinTimer); return; }
        clearInterval(spinTimer);
        el.classList.remove('rm-step-active');
        el.classList.add('rm-step-done');
        icon.textContent = '✓'; // ✓
        activateStep(i + 1);
      }, 200 + (i === items.length - 1 ? 100 : 0));
    }

    activateStep(0);
  }

  function collapseScan(done) {
    scanEl.classList.add('rm-scan-done');
    setTimeout(function () { if (done) done(); }, 420);
  }

  /* Phase 2 — executive summary sentence reveal */
  function runPhase2(sid, done) {
    if (sid !== _sessionId) return;

    var sentences = brief.executiveSummary || [];
    var section = mkSection('executive-summary', 'Executive summary');
    var summaryDiv = d.createElement('div');
    summaryDiv.className = 'rm-summary';

    var elems = sentences.map(function (text) {
      var p = d.createElement('p');
      p.className = 'rm-sentence';
      p.textContent = text;
      summaryDiv.appendChild(p);
      return p;
    });
    section.querySelector('.rm-section-body').appendChild(summaryDiv);
    bodyEl.appendChild(section);

    var delay = 0;
    elems.forEach(function (el, i) {
      setTimeout(function () {
        if (sid !== _sessionId) return;
        el.classList.add('rm-in');
      }, delay);
      delay += reducedMotion ? 0 : 320;
    });

    setTimeout(function () {
      if (done) done();
    }, reducedMotion ? 0 : delay + 100);
  }

  /* Phase 3 — all remaining cards stagger in */
  function runPhase3(sid) {
    if (sid !== _sessionId) return;
    _lastRenderMs = Date.now(); // R9: mark cache valid (body is now being built)

    var allItems = [];
    allItems = allItems.concat(buildAtAGlance());
    allItems = allItems.concat(buildFitSignals());
    allItems = allItems.concat(buildHighlights());
    allItems = allItems.concat(buildProjects());
    allItems = allItems.concat(buildSkills());
    allItems = allItems.concat(buildAlsoExplore());
    allItems = allItems.concat(buildAvailability());

    var delay = 0;
    allItems.forEach(function (el) {
      setTimeout(function () {
        if (sid !== _sessionId) return;
        el.classList.add('rm-in');
      }, delay);
      delay += reducedMotion ? 0 : 50;
    });
  }

  /* ════════════════════════════════════════════════
     SECTION BUILDERS
     Each returns an array of animatable elements.
  ════════════════════════════════════════════════ */

  function buildAtAGlance() {
    var items = brief.atAGlance || [];
    var section = mkSection('at-a-glance', 'At a glance');
    var grid = d.createElement('div');
    grid.className = 'rm-glance-grid';

    var elems = items.map(function (item) {
      var el = d.createElement('div');
      el.className = 'rm-glance-item';
      el.innerHTML =
        '<span class="rm-glance-label">' + esc(item.label) + '</span>' +
        '<span class="rm-glance-value">' + esc(item.value) + '</span>';
      grid.appendChild(el);
      return el;
    });
    section.querySelector('.rm-section-body').appendChild(grid);
    bodyEl.appendChild(section);
    return elems;
  }

  function buildFitSignals() {
    var signals = brief.fitSignals || [];
    var section = mkSection('why-hire', 'Why hire');
    var list = d.createElement('div');
    list.className = 'rm-signals';

    var elems = signals.map(function (text) {
      var el = d.createElement('div');
      el.className = 'rm-signal';
      el.innerHTML =
        '<span class="rm-signal-check" aria-hidden="true">✓</span>' +
        '<span>' + esc(text) + '</span>';
      list.appendChild(el);
      return el;
    });
    section.querySelector('.rm-section-body').appendChild(list);
    bodyEl.appendChild(section);
    return elems;
  }

  function buildHighlights() {
    var items = brief.highlights || [];
    var section = mkSection('experience', 'Experience highlights');
    var cards = d.createElement('div');
    cards.className = 'rm-cards';

    var elems = items.map(function (h) {
      var el = d.createElement('button');
      el.className = 'rm-card';
      el.setAttribute('aria-label', 'Jump to ' + h.label + ' section');
      el.innerHTML =
        '<div class="rm-card-head">' +
          '<span class="rm-card-label">' + esc(h.label) + '</span>' +
          '<span class="rm-card-period">' + esc(h.period) + '</span>' +
        '</div>' +
        '<div class="rm-card-detail">' + esc(h.detail) + '</div>';
      el.addEventListener('click', function () { jumpTo(h.anchor); });
      cards.appendChild(el);
      return el;
    });
    section.querySelector('.rm-section-body').appendChild(cards);
    bodyEl.appendChild(section);
    return elems;
  }

  function buildProjects() {
    var items = brief.topProjects || [];
    var section = mkSection('projects', 'Top projects');
    var cards = d.createElement('div');
    cards.className = 'rm-cards';

    var elems = items.map(function (p) {
      var el = d.createElement('button');
      el.className = 'rm-card';
      el.setAttribute('aria-label', 'Jump to ' + p.name + ' in projects section');
      var tagsHtml = (p.tags || []).map(function (t) {
        return '<span class="rm-tag">' + esc(t) + '</span>';
      }).join('');
      el.innerHTML =
        '<div class="rm-card-head">' +
          '<span class="rm-card-label">' + esc(p.name) + '</span>' +
          '<span class="rm-card-arrow" aria-hidden="true">↗</span>' +
        '</div>' +
        '<div class="rm-card-metric">' + esc(p.metric) + '</div>' +
        '<div class="rm-card-tags">' + tagsHtml + '</div>';
      el.addEventListener('click', function () { jumpTo(p.anchor); });
      cards.appendChild(el);
      return el;
    });
    section.querySelector('.rm-section-body').appendChild(cards);
    bodyEl.appendChild(section);
    return elems;
  }

  function buildSkills() {
    var tiers = brief.skillsTier || {};
    var section = mkSection('skills', 'Skills');
    var wrap = section.querySelector('.rm-section-body');

    function mkTier(label, chips, cls) {
      var el = d.createElement('div');
      el.className = 'rm-skills-tier';
      el.innerHTML = '<div class="rm-tier-label">' + esc(label) + '</div>';
      var chipWrap = d.createElement('div');
      chipWrap.className = 'rm-tier-chips';
      (chips || []).forEach(function (name) {
        var span = d.createElement('span');
        span.className = 'rm-chip ' + cls;
        span.textContent = name;
        chipWrap.appendChild(span);
      });
      el.appendChild(chipWrap);
      wrap.appendChild(el);
      return el;
    }

    var elems = [
      mkTier('Primary', tiers.primary,   'rm-chip-primary'),
      mkTier('Also use', tiers.secondary, 'rm-chip-secondary'),
      mkTier('Familiar', tiers.also,      'rm-chip-also')
    ];
    bodyEl.appendChild(section);
    return elems;
  }

  function buildAlsoExplore() {
    var items = brief.alsoExplore || [];
    if (!items.length) return [];
    var section = mkSection('also-explore', 'Also explore');
    var list = d.createElement('div');
    list.className = 'rm-explore-list';

    var elems = items.map(function (item) {
      var el = d.createElement('a');
      el.className = 'rm-explore-link';
      el.href = item.href;
      /* Anchor-only links stay in-page; external open in new tab */
      if (item.href && !item.href.startsWith('#') && !item.href.startsWith('/')) {
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
      el.innerHTML =
        '<span class="rm-explore-label">' + esc(item.label) + '</span>' +
        '<span class="rm-explore-note">' + esc(item.note || '') + '</span>' +
        '<span class="rm-explore-arrow" aria-hidden="true">↗</span>';
      el.addEventListener('click', function () {
        /* Close panel on click so user lands on the page cleanly */
        if (!item.href.startsWith('/#') && !item.href.startsWith('#')) close();
      });
      list.appendChild(el);
      return el;
    });
    section.querySelector('.rm-section-body').appendChild(list);
    bodyEl.appendChild(section);
    return elems;
  }

  function buildAvailability() {
    var meta = brief.meta || {};
    var section = mkSection('availability', 'Availability & contact');
    var wrap = section.querySelector('.rm-section-body');

    var rows = [
      { label: 'status',   val: meta.status       },
      { label: 'location', val: meta.location      },
      { label: 'avail.',   val: meta.availability  }
    ];

    var avDiv = d.createElement('div');
    avDiv.className = 'rm-avail-row';
    rows.forEach(function (r) {
      if (!r.val) return;
      var row = d.createElement('div');
      row.className = 'rm-avail-item';
      row.innerHTML =
        '<span class="rm-avail-dot" aria-hidden="true"></span>' +
        '<span class="rm-avail-label">' + esc(r.label) + '</span>' +
        '<span class="rm-avail-val">' + esc(r.val) + '</span>';
      avDiv.appendChild(row);
    });
    wrap.appendChild(avDiv);
    bodyEl.appendChild(section);
    return [avDiv];
  }

  /* ════════════════════════════════════════════════
     IMMEDIATE RENDER (prefers-reduced-motion)
  ════════════════════════════════════════════════ */
  function renderAllImmediate() {
    _lastRenderMs = Date.now(); // R9: mark cache valid
    scanEl.innerHTML = '';
    bodyEl.innerHTML = '';

    buildAtAGlance();
    buildFitSignals();
    buildHighlights();
    buildProjects();
    buildSkills();
    buildAlsoExplore();
    buildAvailability();

    // Add summary at top of body
    var sentences = brief.executiveSummary || [];
    var section = mkSection('executive-summary', 'Executive summary');
    var div = d.createElement('div');
    div.className = 'rm-summary';
    sentences.forEach(function (text) {
      var p = d.createElement('p');
      p.className = 'rm-sentence rm-in';
      p.textContent = text;
      div.appendChild(p);
    });
    section.querySelector('.rm-section-body').appendChild(div);
    bodyEl.insertBefore(section, bodyEl.firstChild);

    // Make all animatable items immediately visible
    bodyEl.querySelectorAll(
      '.rm-glance-item, .rm-signal, .rm-card, .rm-skills-tier, .rm-explore-link, .rm-avail-row'
    ).forEach(function (el) { el.classList.add('rm-in'); });
  }

  /* ════════════════════════════════════════════════
     SECTION JUMP
  ════════════════════════════════════════════════ */
  function jumpTo(anchor) {
    close();
    setTimeout(function () {
      var target = d.querySelector(anchor);
      if (!target) return;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      target.classList.add('recruiter-flash');
      setTimeout(function () { target.classList.remove('recruiter-flash'); }, 1400);
    }, 380);
  }

  /* ════════════════════════════════════════════════
     COPY BRIEF
  ════════════════════════════════════════════════ */
  function copyBrief() {
    var meta      = brief.meta || {};
    var sentences = brief.executiveSummary || [];
    var glance    = brief.atAGlance || [];
    var signals   = brief.fitSignals || [];
    var skills    = brief.skillsTier || {};

    var lines = [
      '== RECRUITER BRIEFING: ' + (meta.candidate || '') + ' ==',
      meta.title || '',
      meta.location || '',
      meta.status || '',
      '',
      '-- SUMMARY --',
      sentences.join(' '),
      '',
      '-- AT A GLANCE --',
      glance.map(function (i) { return i.label + ': ' + i.value; }).join('\n'),
      '',
      '-- WHY HIRE --',
      signals.map(function (s) { return '✓ ' + s; }).join('\n'),
      '',
      '-- SKILLS --',
      'Primary: '   + (skills.primary   || []).join(', '),
      'Secondary: ' + (skills.secondary || []).join(', '),
      'Also: '      + (skills.also      || []).join(', '),
      '',
      '-- CONTACT --',
      'Email: '    + (meta.email    || ''),
      'LinkedIn: ' + (meta.linkedin || ''),
      'Resume: '   + (meta.resume   || ''),
      '',
      'Generated from: https://anmshpndy.com/?recruiter=1'
    ];

    var text = lines.join('\n');

    /* R7: reuse sitewide #copyToast instead of a separate .rm-toast element */
    function showToast(msg) {
      var toast = d.getElementById('copyToast');
      if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2400);
      }
      /* Also announce via existing live region */
      var announce = d.getElementById('shortcut-announce');
      if (announce) { announce.textContent = ''; announce.textContent = msg; }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('✓ Brief copied');
      }).catch(function () {
        fallbackCopy(text, showToast);
      });
    } else {
      fallbackCopy(text, showToast);
    }
  }

  function fallbackCopy(text, onDone) {
    var ta = d.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    d.body.appendChild(ta);
    ta.focus(); ta.select();
    try {
      d.execCommand('copy');
      onDone('✓ Brief copied');
    } catch (e) {
      onDone('Copy failed — select text manually');
    }
    ta.remove();
  }

  /* ════════════════════════════════════════════════
     FOCUS TRAP
  ════════════════════════════════════════════════ */
  var _focusTrapHandler = null;

  function trapFocus() {
    // Move focus into sheet
    setTimeout(function () {
      var first = getFocusables()[0];
      if (first) first.focus();
    }, 40);

    _focusTrapHandler = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var focusables = getFocusables();
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (d.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (d.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };
    d.addEventListener('keydown', _focusTrapHandler);
  }

  function releaseFocus() {
    if (_focusTrapHandler) {
      d.removeEventListener('keydown', _focusTrapHandler);
      _focusTrapHandler = null;
    }
  }

  function getFocusables() {
    if (!sheet) return [];
    return Array.from(sheet.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'
    )).filter(function (el) {
      return !el.closest('[hidden]') && el.offsetParent !== null;
    });
  }

  /* ════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════ */

  function mkSection(id, title) {
    var section = d.createElement('div');
    section.className = 'rm-section';
    section.id = 'rm-s-' + id;
    var h = d.createElement('h3');
    h.className = 'rm-section-title';
    h.textContent = title;
    var body = d.createElement('div');
    body.className = 'rm-section-body';
    section.appendChild(h);
    section.appendChild(body);
    return section;
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function syncToggles(on) {
    /* Single header icon toggle is the only entry point */
    var toggle = d.getElementById('header-rm-toggle');
    if (toggle) toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    /* Sync header recruiter-active class (shows exit button, collapses label) */
    var hdr = d.querySelector('header');
    if (hdr) hdr.classList.toggle('recruiter-active', on);
  }

  /* ════════════════════════════════════════════════
     WIRE UP EVENTS
  ════════════════════════════════════════════════ */

  // Close / minimize buttons
  if (closeBtn) closeBtn.addEventListener('click', function () { close(); });
  if (minBtn)   minBtn.addEventListener('click',   function () { close(); }); // v1: minimize = close

  // Tap backdrop to close
  if (backdrop) {
    backdrop.addEventListener('click', function () { close(); });
  }

  // Copy brief
  if (copyBtn) copyBtn.addEventListener('click', function () { copyBrief(); });

  /* ════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════ */
  window.RecruiterBriefing = {
    open:     function (fromToggle) { open(fromToggle); },
    close:    function () { close(); },
    toggle:   function (fromToggle) { toggle(fromToggle); },
    isOpen:   function () { return _isOpen; },
    isActive: function () { return _isActive; }
  };

})();
