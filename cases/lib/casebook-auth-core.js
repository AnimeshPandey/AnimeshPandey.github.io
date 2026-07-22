/**
 * casebook-auth-core.js — shared auth helpers (Node + browser via CasebookAuthCore).
 *
 * Token generation and verification live server-side only, in
 * workers/magic-link/index.js — a client-side implementation would have to
 * ship the HMAC secret to the browser to check a signature, which lets
 * anyone forge a token for any email. This file used to include makeToken/
 * parseToken doing exactly that (a public salt + non-cryptographic hash,
 * trivially forgeable from the browser console); removed in favor of the
 * worker's real HMAC-SHA256 signing and its POST /verify endpoint — see
 * casebook-auth.js's applyTokenFromQuery.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CasebookAuthCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AUTH_KEY = 'casebook-auth-v1';

  function normalizeEmail(email) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  return {
    AUTH_KEY: AUTH_KEY,
    normalizeEmail: normalizeEmail,
  };
});
