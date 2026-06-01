/**
 * casebook-auth-core.js — shared auth token helpers (Node + browser via CasebookAuthCore).
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
  var SALT = 'casebook-magic-v1';

  function normalizeEmail(email) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function makeToken(email) {
    var norm = normalizeEmail(email);
    var sig = hashString(SALT + ':' + norm);
    var payload = norm + ':' + sig;
    if (typeof btoa === 'function') {
      return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return Buffer.from(payload, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function parseToken(token) {
    if (!token) return null;
    try {
      var padded = token.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4) padded += '=';
      var raw;
      if (typeof atob === 'function') {
        raw = atob(padded);
      } else {
        raw = Buffer.from(padded, 'base64').toString('utf8');
      }
      var parts = raw.split(':');
      if (parts.length < 2) return null;
      var email = parts.slice(0, -1).join(':');
      var sig = parts[parts.length - 1];
      if (hashString(SALT + ':' + email) !== sig) return null;
      return { email: email };
    } catch (e) {
      return null;
    }
  }

  return {
    AUTH_KEY: AUTH_KEY,
    SALT: SALT,
    normalizeEmail: normalizeEmail,
    hashString: hashString,
    makeToken: makeToken,
    parseToken: parseToken,
  };
});
