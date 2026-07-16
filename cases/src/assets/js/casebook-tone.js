/**
 * casebook-tone.js — shared reading level (Junior / Mid / Staff) for Casebook.
 */
(function initCasebookTone() {
  'use strict';

  var TONE_KEY = 'casebook-tone';
  var VALID = ['junior', 'mid', 'staff'];

  function getTone() {
    try {
      var t = localStorage.getItem(TONE_KEY);
      if (VALID.indexOf(t) !== -1) return t;
    } catch (e) { /* ignore */ }
    return 'junior';
  }

  function syncToneBlocks(tone) {
    document.querySelectorAll('.tone-junior').forEach(function (el) {
      el.style.display = tone === 'junior' ? 'block' : 'none';
    });
    document.querySelectorAll('.tone-mid').forEach(function (el) {
      el.style.display = tone === 'mid' ? 'block' : 'none';
    });
    document.querySelectorAll('.tone-staff').forEach(function (el) {
      el.style.display = tone === 'staff' ? 'block' : 'none';
    });
  }

  function syncToneButtons(tone) {
    document.querySelectorAll('.case-tone__btn[data-tone]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.tone === tone ? 'true' : 'false');
    });
    /* [data-casey-panel-tier] buttons use role="radio" + aria-checked (set by
       casey-companion-prefs.js's refreshPanel/bindPanel) — aria-pressed is not
       an allowed attribute on role="radio" per the ARIA spec, so this radiogroup
       is intentionally excluded here. */
  }

  function setTone(tone) {
    if (VALID.indexOf(tone) === -1) return;
    syncToneBlocks(tone);
    syncToneButtons(tone);
    try {
      localStorage.setItem(TONE_KEY, tone);
    } catch (e) { /* ignore */ }
    document.documentElement.dataset.casebookTone = tone;
    document.dispatchEvent(
      new CustomEvent('casebook-tone-change', { detail: { tone: tone }, bubbles: true })
    );
  }

  window.CasebookTone = {
    getTone: getTone,
    setTone: setTone,
    syncUI: function (tone) {
      tone = tone || getTone();
      syncToneBlocks(tone);
      syncToneButtons(tone);
      document.documentElement.dataset.casebookTone = tone;
    },
  };

  document.documentElement.dataset.casebookTone = getTone();
}());
