/* pro-gate.js — Honor-system Pro unlock for The Frontend Casebook.
   Phase A (pre-100 MAU): payments.enabled = false in site.json.
   Phase B: flip payments.enabled = true and set gumroad/lemon squeezy URLs.

   How it works:
   - localStorage.casebookPro = "unlocked" → full access
   - URL ?license=KEY on /account/ → validates key format and stores
   - Pro gate hides content with .pro-gate class until unlocked
*/

(function () {
  'use strict';

  var STORAGE_KEY = 'casebookPro';
  var UNLOCK_VALUE = 'unlocked';

  function isUnlocked() {
    try {
      return localStorage.getItem(STORAGE_KEY) === UNLOCK_VALUE;
    } catch (e) {
      return false;
    }
  }

  function unlock() {
    try {
      localStorage.setItem(STORAGE_KEY, UNLOCK_VALUE);
    } catch (e) {}
  }

  function lock() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  // Check URL ?license= param on account page
  function checkLicenseParam() {
    var params = new URLSearchParams(window.location.search);
    var key = params.get('license');
    if (!key) return false;
    // Basic format validation (real validation is honor-system — key is just a token)
    if (key.length >= 8) {
      unlock();
      // Clean URL
      var url = new URL(window.location.href);
      url.searchParams.delete('license');
      history.replaceState({}, '', url.toString());
      return true;
    }
    return false;
  }

  // Apply gate to pro content sections on the current page
  function applyGate() {
    var gates = document.querySelectorAll('.pro-gate');
    if (gates.length === 0) return;

    var unlocked = isUnlocked();
    gates.forEach(function (gate) {
      if (unlocked) {
        gate.removeAttribute('hidden');
        gate.removeAttribute('aria-hidden');
        var overlay = gate.querySelector('.pro-gate__overlay');
        if (overlay) overlay.remove();
      } else {
        // Show pro preview banner instead
        var banner = document.querySelector('.pro-preview-banner');
        if (banner) banner.removeAttribute('hidden');
      }
    });
  }

  // Wire unlock CTA buttons
  function wireUnlockButtons() {
    document.querySelectorAll('[data-pro-unlock]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var paymentsEnabled = btn.dataset.paymentsEnabled === 'true';
        var url = btn.dataset.proUrl;

        if (!paymentsEnabled || !url) {
          e.preventDefault();
          // Redirect to waitlist/newsletter
          var waitlist = btn.dataset.waitlistUrl;
          if (waitlist) window.open(waitlist, '_blank', 'noopener');
        }
        // If payments enabled: follow href to checkout
      });
    });
  }

  // Public API
  window.CasebookPro = {
    isUnlocked: isUnlocked,
    unlock: unlock,
    lock: lock,
  };

  // Init
  checkLicenseParam();
  document.addEventListener('DOMContentLoaded', function () {
    applyGate();
    wireUnlockButtons();
  });
}());
