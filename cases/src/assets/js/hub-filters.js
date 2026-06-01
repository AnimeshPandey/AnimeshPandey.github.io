/* hub-filters.js — Library reading room filter + pagination module
   Public API: LibraryFilters.init(config), LibraryFilters.clearAll()
   Handles: category chips, company combobox, year/locale/sort selects,
            URL state sync, pagination (50/page), mobile filter sheet. */

/* global LibraryFilters */
var LibraryFilters = (function () {
  'use strict';

  var PAGE_SIZE = 50;
  var DEBOUNCE_MS = 180;

  var _cfg = {};
  var _allEntries = [];
  var _filteredEntries = [];
  var _currentPage = 1;
  var _activeFilters = {};
  var _debounceTimer = null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function debounce(fn, ms) {
    return function () {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(fn, ms);
    };
  }

  function getParam(key) {
    var params = new URLSearchParams(window.location.search);
    return params.get(key) || '';
  }

  function syncToURL(filters) {
    var params = new URLSearchParams();
    Object.keys(filters).forEach(function (k) {
      if (filters[k]) params.set(k, filters[k]);
    });
    var search = params.toString();
    var url = window.location.pathname + (search ? '?' + search : '');
    history.pushState({ filters: filters }, '', url);
  }

  function readFiltersFromURL() {
    return {
      category: getParam('category'),
      company: getParam('company'),
      year: getParam('year'),
      locale: getParam('locale'),
      sort: getParam('sort') || 'newest',
    };
  }

  // ── Filter logic ─────────────────────────────────────────────────────────

  function matchesFilters(entry, filters) {
    if (filters.category && !entry.categories.includes(filters.category)) {
      return false;
    }
    if (filters.company && entry.companySlug !== filters.company) {
      return false;
    }
    if (filters.year && String(entry.publishedYear) !== filters.year) {
      return false;
    }
    if (filters.locale && entry.locale !== filters.locale) {
      return false;
    }
    return true;
  }

  function sortEntries(entries, sortVal) {
    var sorted = entries.slice();
    if (sortVal === 'newest') {
      sorted.sort(function (a, b) { return (b.publishedYear || 0) - (a.publishedYear || 0); });
    } else if (sortVal === 'oldest') {
      sorted.sort(function (a, b) { return (a.publishedYear || 0) - (b.publishedYear || 0); });
    } else if (sortVal === 'title-az') {
      sorted.sort(function (a, b) { return a.title.localeCompare(b.title); });
    } else if (sortVal === 'company') {
      sorted.sort(function (a, b) { return a.company.localeCompare(b.company); });
    }
    return sorted;
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────

  function getEl(id) {
    return document.getElementById(id);
  }

  function showItems(items, page) {
    var start = (page - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    items.forEach(function (item, i) {
      var inPage = i >= start && i < end;
      item.style.display = inPage ? '' : 'none';
    });
  }

  function updatePagination(total, page) {
    var totalPages = Math.ceil(total / PAGE_SIZE);
    var paginationEl = getEl(_cfg.paginationId);
    var prevBtn = getEl(_cfg.prevId);
    var nextBtn = getEl(_cfg.nextId);
    var pageInfo = getEl(_cfg.pageInfoId);

    if (!paginationEl) return;

    if (totalPages <= 1) {
      paginationEl.hidden = true;
      return;
    }

    paginationEl.hidden = false;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    if (pageInfo) {
      pageInfo.textContent = 'Page ' + page + ' of ' + totalPages;
    }
  }

  function updateCount(visible, total) {
    var countEl = getEl(_cfg.countId);
    if (countEl) {
      countEl.textContent = visible;
    }
  }

  function updateEmptyState(visible) {
    var emptyEl = getEl(_cfg.emptyId);
    var gridEl = getEl(_cfg.gridId);
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (gridEl) gridEl.hidden = visible === 0;
    document.dispatchEvent(
      new CustomEvent('casey-library-filter', { detail: { count: visible } })
    );
  }

  // ── Filter pills ──────────────────────────────────────────────────────────

  var FILTER_LABELS = {
    category: 'Topic',
    company: 'Company',
    year: 'Year',
    locale: 'Language',
  };

  function updateFilterPills(filters) {
    var pillsEl = getEl(_cfg.filterPillsId);
    var clearAllBtn = getEl(_cfg.clearAllId);
    var badgeEl = getEl(_cfg.activeBadgeId);
    if (!pillsEl) return;

    pillsEl.innerHTML = '';
    var activeCount = 0;

    Object.keys(filters).forEach(function (k) {
      if (!filters[k] || k === 'sort') return;
      activeCount++;
      var pill = document.createElement('span');
      pill.className = 'hub-filter-pill';
      var label = (FILTER_LABELS[k] || k) + ': ' + filters[k];
      pill.innerHTML =
        '<span>' + label + '</span>' +
        '<button class="hub-filter-pill__remove" aria-label="Remove ' + label + ' filter" data-key="' + k + '">' +
        '×</button>';
      pillsEl.appendChild(pill);
    });

    if (clearAllBtn) clearAllBtn.hidden = activeCount === 0;
    if (badgeEl) {
      badgeEl.hidden = activeCount === 0;
      badgeEl.textContent = String(activeCount);
    }

    // Remove pill click handlers
    pillsEl.querySelectorAll('.hub-filter-pill__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.key;
        _activeFilters[key] = '';
        applyFilters(_activeFilters);
        syncControlsToFilters(_activeFilters);
      });
    });
  }

  // ── Sync controls to filter state ────────────────────────────────────────

  function syncControlsToFilters(filters) {
    // Category chips
    var chipsEl = getEl(_cfg.categoryChipsId);
    if (chipsEl) {
      chipsEl.querySelectorAll('.chip[data-filter="category"]').forEach(function (chip) {
        var active = chip.dataset.value === (filters.category || '');
        chip.classList.toggle('chip--active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    // Company input
    var companyInput = getEl(_cfg.companyInputId);
    if (companyInput) {
      companyInput.value = filters.company || '';
    }

    // Year select
    var yearSelect = getEl(_cfg.yearSelectId);
    if (yearSelect) yearSelect.value = filters.year || '';

    // Locale select
    var localeSelect = getEl(_cfg.localeSelectId);
    if (localeSelect) localeSelect.value = filters.locale || '';

    // Sort select
    var sortSelect = getEl(_cfg.sortSelectId);
    if (sortSelect) sortSelect.value = filters.sort || 'newest';
  }

  // ── Main apply ────────────────────────────────────────────────────────────

  function applyFilters(filters) {
    _activeFilters = filters;
    _currentPage = 1;

    var filtered = _allEntries.filter(function (entry) {
      return matchesFilters(entry, filters);
    });
    filtered = sortEntries(filtered, filters.sort || 'newest');
    _filteredEntries = filtered;

    // Show/hide grid items by slug
    var allItems = document.querySelectorAll('#' + _cfg.gridId + ' .library-grid__item');
    var slugOrder = filtered.map(function (e) { return e.slug; });

    // Re-order items in DOM to match sort, then show/hide for pagination
    allItems.forEach(function (item) {
      var card = item.querySelector('.reading-card');
      var slug = card ? card.querySelector('[href]') : null;
      // Use data-idx for mapping
    });

    // Map by data-idx
    var idxToItem = {};
    allItems.forEach(function (item) {
      idxToItem[item.dataset.idx] = item;
    });

    // Build slug→idx map from allEntries
    var slugToIdx = {};
    _allEntries.forEach(function (e, i) { slugToIdx[e.slug] = i; });

    // Sort items in DOM
    var grid = getEl(_cfg.gridId);
    if (grid) {
      // Skeleton flash: briefly dim cards while filter is applied
      grid.classList.add('hub-grid--filtering');

      var sortedItems = filtered.map(function (e) {
        return idxToItem[String(slugToIdx[e.slug])];
      }).filter(Boolean);

      // Append in new order
      sortedItems.forEach(function (item) {
        grid.appendChild(item);
      });

      // Hide items not in filtered set
      var filteredSlugs = new Set(filtered.map(function (e) { return e.slug; }));
      allItems.forEach(function (item) {
        var idx = item.dataset.idx;
        var entry = _allEntries[parseInt(idx, 10)];
        var inFiltered = entry && filteredSlugs.has(entry.slug);
        item.hidden = !inFiltered;
      });

      // Apply pagination
      var visibleItems = sortedItems;
      showItems(visibleItems, _currentPage);

      // Remove skeleton class after brief delay
      setTimeout(function () { grid.classList.remove('hub-grid--filtering'); }, 150);
    }

    updateCount(filtered.length, _allEntries.length);
    updateEmptyState(filtered.length);
    updatePagination(filtered.length, _currentPage);
    updateFilterPills(filters);
    syncToURL(filters);
  }

  var applyFiltersDebounced = debounce(function () {
    applyFilters(_activeFilters);
  }, DEBOUNCE_MS);

  // ── Combobox ──────────────────────────────────────────────────────────────

  function initCombobox(companies) {
    var input = getEl(_cfg.companyInputId);
    var listbox = getEl(_cfg.companyListboxId);
    if (!input || !listbox) return;

    var activeIndex = -1;

    function renderOptions(query) {
      var q = query.trim().toLowerCase();
      var matches = q
        ? companies.filter(function (c) {
            return c.name.toLowerCase().includes(q) || c.slug.includes(q);
          }).slice(0, 12)
        : companies.slice(0, 12);

      listbox.innerHTML = '';
      if (matches.length === 0) {
        listbox.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        return;
      }

      matches.forEach(function (c, i) {
        var li = document.createElement('li');
        li.className = 'combobox-option';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.setAttribute('id', 'combobox-opt-' + i);
        li.dataset.slug = c.slug;
        li.innerHTML = c.name + '<span class="combobox-option__count">' + c.count + '</span>';
        li.addEventListener('mousedown', function (e) {
          e.preventDefault();
          selectOption(c);
        });
        listbox.appendChild(li);
      });

      activeIndex = -1;
      listbox.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function selectOption(company) {
      input.value = company.name;
      input.setAttribute('aria-activedescendant', '');
      listbox.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      _activeFilters.company = company.slug;
      applyFilters(_activeFilters);
      syncControlsToFilters(_activeFilters);
    }

    function clearOption() {
      input.value = '';
      listbox.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      _activeFilters.company = '';
      applyFilters(_activeFilters);
      syncControlsToFilters(_activeFilters);
    }

    input.addEventListener('input', function () {
      if (!input.value.trim()) {
        clearOption();
      } else {
        renderOptions(input.value);
      }
    });

    input.addEventListener('focus', function () {
      renderOptions(input.value);
    });

    input.addEventListener('blur', function () {
      setTimeout(function () { listbox.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 150);
    });

    input.addEventListener('keydown', function (e) {
      var options = listbox.querySelectorAll('.combobox-option');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, options.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && options[activeIndex]) {
          var slug = options[activeIndex].dataset.slug;
          var match = companies.find(function (c) { return c.slug === slug; });
          if (match) selectOption(match);
        }
      } else if (e.key === 'Escape') {
        listbox.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        activeIndex = -1;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        options.forEach(function (o, i) {
          var active = i === activeIndex;
          o.setAttribute('aria-selected', active ? 'true' : 'false');
          if (active) {
            input.setAttribute('aria-activedescendant', o.id);
            o.scrollIntoView({ block: 'nearest' });
          }
        });
      }
    });
  }

  // ── Mobile sheet ──────────────────────────────────────────────────────────

  function initMobileSheet() {
    var toggle = getEl(_cfg.toggleId);
    var sheet = getEl(_cfg.sheetId);
    var closeBtn = getEl(_cfg.sheetCloseId);
    var clearBtn = getEl(_cfg.sheetClearId);
    var applyBtn = getEl(_cfg.sheetApplyId);

    if (!toggle || !sheet) return;

    var overlay = document.createElement('div');
    overlay.className = 'filter-sheet__overlay';
    document.body.appendChild(overlay);

    var _sheetOpen = false;
    var _prevFocus = null;

    function openSheet() {
      _prevFocus = document.activeElement;
      _sheetOpen = true;
      sheet.hidden = false;
      overlay.classList.add('is-visible');
      requestAnimationFrame(function () {
        sheet.classList.add('is-open');
      });
      toggle.setAttribute('aria-expanded', 'true');
      // Populate sheet body from desktop controls
      populateSheetBody();
      // Trap focus
      var firstFocusable = sheet.querySelector('button, [href], input, select, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
      document.addEventListener('keydown', sheetKeyHandler);
    }

    function closeSheet() {
      _sheetOpen = false;
      sheet.classList.remove('is-open');
      overlay.classList.remove('is-visible');
      toggle.setAttribute('aria-expanded', 'false');
      setTimeout(function () {
        sheet.hidden = true;
      }, 240);
      if (_prevFocus) _prevFocus.focus();
      document.removeEventListener('keydown', sheetKeyHandler);
    }

    function sheetKeyHandler(e) {
      if (e.key === 'Escape') { closeSheet(); return; }
      if (e.key === 'Tab') {
        var focusable = Array.from(sheet.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function populateSheetBody() {
      var body = sheet.querySelector('.filter-sheet__body');
      if (!body) return;
      body.innerHTML = '';

      // Category section
      var catSection = document.createElement('div');
      catSection.className = 'filter-sheet__section';
      catSection.innerHTML = '<p class="filter-sheet__label">Topic</p>';
      var chips = document.createElement('div');
      chips.className = 'chip-group';
      var desktopChips = document.querySelectorAll('#' + _cfg.categoryChipsId + ' .chip');
      desktopChips.forEach(function (chip) {
        var clone = chip.cloneNode(true);
        clone.addEventListener('click', function () {
          _activeFilters.category = clone.dataset.value;
          desktopChips.forEach(function (c) {
            c.classList.toggle('chip--active', c.dataset.value === _activeFilters.category);
            c.setAttribute('aria-pressed', c.dataset.value === _activeFilters.category ? 'true' : 'false');
          });
          syncControlsToFilters(_activeFilters);
        });
        chips.appendChild(clone);
      });
      catSection.appendChild(chips);
      body.appendChild(catSection);

      // Year section
      var yearSelect = getEl(_cfg.yearSelectId);
      if (yearSelect) {
        var yearSection = document.createElement('div');
        yearSection.className = 'filter-sheet__section';
        yearSection.innerHTML = '<p class="filter-sheet__label">Year</p>';
        var cloneYear = yearSelect.cloneNode(true);
        cloneYear.classList.add('hub-select');
        cloneYear.addEventListener('change', function () {
          _activeFilters.year = cloneYear.value;
          syncControlsToFilters(_activeFilters);
        });
        yearSection.appendChild(cloneYear);
        body.appendChild(yearSection);
      }

      // Locale section
      var localeSelect = getEl(_cfg.localeSelectId);
      if (localeSelect) {
        var locSection = document.createElement('div');
        locSection.className = 'filter-sheet__section';
        locSection.innerHTML = '<p class="filter-sheet__label">Language</p>';
        var cloneLoc = localeSelect.cloneNode(true);
        cloneLoc.classList.add('hub-select');
        cloneLoc.addEventListener('change', function () {
          _activeFilters.locale = cloneLoc.value;
          syncControlsToFilters(_activeFilters);
        });
        locSection.appendChild(cloneLoc);
        body.appendChild(locSection);
      }
    }

    toggle.addEventListener('click', function () {
      if (_sheetOpen) closeSheet(); else openSheet();
    });
    overlay.addEventListener('click', closeSheet);
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        _activeFilters = { sort: _activeFilters.sort || 'newest' };
        syncControlsToFilters(_activeFilters);
        closeSheet();
        applyFilters(_activeFilters);
      });
    }
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        applyFilters(_activeFilters);
        closeSheet();
      });
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init(config) {
    _cfg = Object.assign({ pageSize: PAGE_SIZE }, config);
    PAGE_SIZE = _cfg.pageSize || 50;

    // Load entries from embedded JSON
    var dataEl = document.getElementById('library-entries-data');
    if (!dataEl) {
      console.warn('LibraryFilters: #library-entries-data not found');
      return;
    }
    try {
      _allEntries = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error('LibraryFilters: failed to parse entries data', e);
      return;
    }

    // Load companies from embedded JSON
    var companiesEl = document.getElementById('hub-companies-data');
    var companies = [];
    if (companiesEl) {
      try {
        companies = JSON.parse(companiesEl.textContent);
      } catch (e) {}
    }

    // Restore filters from URL
    _activeFilters = readFiltersFromURL();

    // Apply initial filters
    applyFilters(_activeFilters);
    syncControlsToFilters(_activeFilters);

    // Category chips
    var chipsEl = getEl(_cfg.categoryChipsId);
    if (chipsEl) {
      chipsEl.querySelectorAll('.chip[data-filter="category"]').forEach(function (chip) {
        chip.addEventListener('click', function () {
          _activeFilters.category = chip.dataset.value;
          applyFilters(_activeFilters);
          syncControlsToFilters(_activeFilters);
        });
        // Keyboard: arrow keys
        chip.addEventListener('keydown', function (e) {
          var chips = Array.from(chipsEl.querySelectorAll('.chip[data-filter="category"]'));
          var idx = chips.indexOf(chip);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            chips[(idx + 1) % chips.length].focus();
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            chips[(idx - 1 + chips.length) % chips.length].focus();
          }
        });
      });
    }

    // Year select
    var yearSelect = getEl(_cfg.yearSelectId);
    if (yearSelect) {
      yearSelect.addEventListener('change', function () {
        _activeFilters.year = yearSelect.value;
        applyFilters(_activeFilters);
      });
    }

    // Locale select
    var localeSelect = getEl(_cfg.localeSelectId);
    if (localeSelect) {
      localeSelect.addEventListener('change', function () {
        _activeFilters.locale = localeSelect.value;
        applyFilters(_activeFilters);
      });
    }

    // Sort select
    var sortSelect = getEl(_cfg.sortSelectId);
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        _activeFilters.sort = sortSelect.value;
        applyFilters(_activeFilters);
      });
    }

    // Clear all
    var clearAllBtn = getEl(_cfg.clearAllId);
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAll);
    }

    // Pagination
    var prevBtn = getEl(_cfg.prevId);
    var nextBtn = getEl(_cfg.nextId);
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (_currentPage > 1) {
          _currentPage--;
          var allItems = document.querySelectorAll('#' + _cfg.gridId + ' .library-grid__item:not([hidden])');
          showItems(Array.from(allItems), _currentPage);
          updatePagination(_filteredEntries.length, _currentPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var totalPages = Math.ceil(_filteredEntries.length / PAGE_SIZE);
        if (_currentPage < totalPages) {
          _currentPage++;
          var allItems = document.querySelectorAll('#' + _cfg.gridId + ' .library-grid__item:not([hidden])');
          showItems(Array.from(allItems), _currentPage);
          updatePagination(_filteredEntries.length, _currentPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Browser back/forward
    window.addEventListener('popstate', function (e) {
      _activeFilters = e.state && e.state.filters ? e.state.filters : readFiltersFromURL();
      applyFilters(_activeFilters);
      syncControlsToFilters(_activeFilters);
    });

    initCombobox(companies);
    initMobileSheet();
  }

  function clearAll() {
    _activeFilters = { sort: 'newest' };
    applyFilters(_activeFilters);
    syncControlsToFilters(_activeFilters);
  }

  return {
    init: init,
    clearAll: clearAll,
    apply: applyFilters,
  };
}());
