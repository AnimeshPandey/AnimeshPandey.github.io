/**
 * casebook-auth.js — client-only email sign-in (magic link in URL).
 * Shared helpers: casebook-auth-core.js (also unit-tested).
 *
 * Form submission POSTs to a Cloudflare Worker which sends the magic link
 * via Resend. The link's token is verified by that same worker's
 * POST /verify — never parsed or checked client-side. A client-side check
 * would need the worker's HMAC secret shipped to the browser, which lets
 * anyone forge a "signed in as any email" token from the console. Update
 * MAGIC_LINK_WORKER_URL after deploying the worker.
 */
(function initCasebookAuth() {
  'use strict';

  var MAGIC_LINK_WORKER_URL = 'https://casebook-magic-link.animeshpandey.workers.dev'; // update after deploy

  var core = window.CasebookAuthCore;
  if (!core) {
    console.warn('[casebook-auth] CasebookAuthCore missing — load casebook-auth-core.js first');
    return;
  }

  var AUTH_KEY = core.AUTH_KEY;
  var normalizeEmail = core.normalizeEmail;

  function loadAuth() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveAuth(email) {
    var data = {
      email: normalizeEmail(email),
      signedInAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('casebook-auth-change', { detail: data }));
    return data;
  }

  function clearAuth() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('casebook-auth-change', { detail: null }));
  }

  /**
   * Consumes ?token= from the URL (if present) by asking the worker to
   * verify it server-side, cleans the URL either way so the token never
   * lingers in browser history, and returns a promise resolving to
   * whether sign-in succeeded. Safe to call once per page load — the
   * caller doesn't need to gate on any earlier DOM state.
   */
  function applyTokenFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token');
    if (!token) return Promise.resolve(false);

    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    return fetch(MAGIC_LINK_WORKER_URL + '/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.valid || !data.email) return false;
        saveAuth(data.email);
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function bindAccountPage() {
    var form = document.getElementById('account-email-form');
    if (!form) return;

    var signedOut = document.getElementById('account-signed-out');
    var linkSent = document.getElementById('account-link-sent');
    var signedIn = document.getElementById('account-signed-in');
    var signedInEmail = document.getElementById('account-signed-in-email');
    var signOutBtn = document.getElementById('account-sign-out');

    var emailInput = document.getElementById('account-email');
    var submitBtn = form.querySelector('button[type="submit"]');

    // Create success and error elements programmatically within the form section
    var successEl = document.getElementById('casebook-auth-success');
    if (!successEl) {
      successEl = document.createElement('p');
      successEl.id = 'casebook-auth-success';
      successEl.className = 'account-form__success';
      successEl.hidden = true;
      form.parentNode.insertBefore(successEl, form.nextSibling);
    }

    var errorEl = document.getElementById('casebook-auth-error');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.id = 'casebook-auth-error';
      errorEl.className = 'account-form__error';
      errorEl.hidden = true;
      form.parentNode.insertBefore(errorEl, form.nextSibling);
    }

    function showPanel(panel) {
      [signedOut, linkSent, signedIn].forEach(function (el) {
        if (el) el.hidden = el !== panel;
      });
    }

    function refresh() {
      var auth = loadAuth();
      if (auth && auth.email) {
        if (signedInEmail) signedInEmail.textContent = auth.email;
        showPanel(signedIn);
        return;
      }
      showPanel(signedOut);
    }

    // Token consumption happens once, at the bottom of this file — refresh()
    // here just renders whatever's already in localStorage; the
    // casebook-auth-change listener below picks up the async verify result.
    refresh();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = normalizeEmail(emailInput && emailInput.value);
      if (!email || email.indexOf('@') === -1) {
        if (emailInput) emailInput.focus();
        return;
      }

      // Reset state
      successEl.hidden = true;
      errorEl.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      fetch(MAGIC_LINK_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            form.hidden = true;
            successEl.hidden = false;
            successEl.textContent = 'Check your email — link sent to ' + email;
          } else {
            errorEl.hidden = false;
            /* design-backlog idea #43: the server's own `data.error` is shown
               whenever present; this is only the last-resort case where the
               API reported failure without a reason. A bare "Something went
               wrong" is the exact anti-pattern this site's own
               cognitive-load-error-recovery case argues against — vague,
               unfalsifiable, no path forward. Say what didn't happen and
               name the retry, same as the network-error fallback below. */
            errorEl.textContent = data.error || "Couldn't send the sign-in link. Try again.";
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Send sign-in link';
            }
          }
        })
        .catch(function () {
          errorEl.hidden = false;
          errorEl.textContent = 'Network error. Try again.';
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send sign-in link';
          }
        });
    });

    if (signOutBtn) {
      signOutBtn.addEventListener('click', function () {
        clearAuth();
        refresh();
      });
    }

    document.addEventListener('casebook-auth-change', refresh);
  }

  function updateNavLabels() {
    var auth = loadAuth();
    document.querySelectorAll('[data-casebook-auth-label]').forEach(function (el) {
      el.textContent = auth && auth.email ? 'Account' : 'Sign in';
    });
    document.querySelectorAll('.hub-progress__account-link').forEach(function (el) {
      el.textContent = auth && auth.email ? 'Account' : 'Sign in';
    });
  }

  applyTokenFromQuery();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindAccountPage();
      updateNavLabels();
    });
  } else {
    bindAccountPage();
    updateNavLabels();
  }

  document.addEventListener('casebook-auth-change', updateNavLabels);

  window.CasebookAuth = {
    load: loadAuth,
    save: saveAuth,
    clear: clearAuth,
  };
}());
