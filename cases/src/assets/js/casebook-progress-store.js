/**
 * casebook-progress-store.js — swappable storage adapter for the
 * companion progress blob (cases started/completed, tone, intensity).
 *
 * Default (and only, today) implementation is localStorage, per explicit
 * instruction: progress persistence stays device-local for now, account
 * sync is a future project. The point of this file is the seam — when
 * that project happens, a backend-backed adapter drops in via setAdapter()
 * with zero changes to casey-companion.js or any other reader/writer of
 * progress state. Load this before casey-companion.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CasebookProgressStore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var hasLocalStorage = typeof localStorage !== 'undefined';

  var localStorageAdapter = {
    get: function (key) {
      if (!hasLocalStorage) return null;
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null; // private/incognito mode, storage disabled, quota, etc.
      }
    },
    set: function (key, value) {
      if (!hasLocalStorage) return false;
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },
    remove: function (key) {
      if (!hasLocalStorage) return;
      try {
        localStorage.removeItem(key);
      } catch (e) {
        /* ignore */
      }
    },
  };

  var activeAdapter = localStorageAdapter;

  return {
    get: function (key) {
      return activeAdapter.get(key);
    },
    set: function (key, value) {
      return activeAdapter.set(key, value);
    },
    remove: function (key) {
      return activeAdapter.remove(key);
    },
    /**
     * Swaps the backing store. An adapter must implement get(key),
     * set(key, value), remove(key) — the same three-method shape as
     * localStorageAdapter, so a future account-backed adapter can fall
     * back to it for anonymous/offline use. Invalid adapters are
     * rejected (silently ignored) rather than partially applied.
     */
    setAdapter: function (adapter) {
      if (
        adapter &&
        typeof adapter.get === 'function' &&
        typeof adapter.set === 'function' &&
        typeof adapter.remove === 'function'
      ) {
        activeAdapter = adapter;
        return true;
      }
      return false;
    },
    /** Resets to the default localStorage adapter — mainly for tests. */
    resetAdapter: function () {
      activeAdapter = localStorageAdapter;
    },
    localStorageAdapter: localStorageAdapter,
  };
});
