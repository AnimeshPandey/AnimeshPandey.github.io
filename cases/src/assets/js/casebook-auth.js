/**
 * casebook-auth.js — client-only email sign-in (magic link in URL).
 * Core token logic: casebook-auth-core.js (also unit-tested).
 */
(function initCasebookAuth() {
  'use strict';

  var core = window.CasebookAuthCore;
  if (!core) {
    console.warn('[casebook-auth] CasebookAuthCore missing — load casebook-auth-core.js first');
    return;
  }

  var AUTH_KEY = core.AUTH_KEY;
  var normalizeEmail = core.normalizeEmail;
  var makeToken = core.makeToken;
  var parseToken = core.parseToken;

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

  function accountBaseUrl() {
    var prefix = document.documentElement.dataset.pathPrefix || '/cases/';
    return new URL(prefix + 'account/', window.location.origin).href;
  }

  function magicLinkFor(email) {
    var token = makeToken(email);
    return accountBaseUrl() + '?token=' + encodeURIComponent(token);
  }

  function applyTokenFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token');
    if (!token) return false;
    var parsed = parseToken(token);
    if (!parsed) return false;
    saveAuth(parsed.email);
    if (window.history && window.history.replaceState) {
      var clean = window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
    return true;
  }

  function bindAccountPage() {
    var form = document.getElementById('account-email-form');
    if (!form) return;

    var signedOut = document.getElementById('account-signed-out');
    var linkSent = document.getElementById('account-link-sent');
    var signedIn = document.getElementById('account-signed-in');
    var emailDisplay = document.getElementById('account-email-display');
    var magicInput = document.getElementById('account-magic-url');
    var signedInEmail = document.getElementById('account-signed-in-email');
    var signOutBtn = document.getElementById('account-sign-out');
    var copyBtn = document.getElementById('account-copy-link');

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

    applyTokenFromQuery();
    refresh();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('account-email');
      var email = normalizeEmail(input && input.value);
      if (!email || email.indexOf('@') === -1) {
        if (input) input.focus();
        return;
      }
      var url = magicLinkFor(email);
      if (emailDisplay) emailDisplay.textContent = email;
      if (magicInput) magicInput.value = url;
      showPanel(linkSent);
    });

    if (copyBtn && magicInput) {
      copyBtn.addEventListener('click', function () {
        magicInput.select();
        try {
          navigator.clipboard.writeText(magicInput.value);
          copyBtn.textContent = 'Copied';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
        } catch (err) {
          document.execCommand('copy');
        }
      });
    }

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
    magicLinkFor: magicLinkFor,
    makeToken: makeToken,
    parseToken: parseToken,
  };
}());
