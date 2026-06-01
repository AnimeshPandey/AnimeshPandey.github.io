/**
 * sw-migrate.js — run synchronously in <head> before CSS on every page.
 * Clears legacy service-worker caches (ap-v*), unregisters old workers once per
 * deploy build id, then registers the pass-through sw.js.
 */
(function (global) {
  'use strict';

  var BUILD = '__AP_BUILD_ID__';
  var STORAGE_KEY = 'ap-asset-build';
  var RELOAD_KEY = 'ap-sw-migrate-reload';

  if (!('serviceWorker' in navigator)) return;

  function clearAllCaches() {
    if (!('caches' in global)) return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    });
  }

  function unregisterAll() {
    return navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.unregister(); }));
    });
  }

  function registerPassThrough() {
    return navigator.serviceWorker.register('/sw.js?v=' + encodeURIComponent(BUILD), {
      updateViaCache: 'none',
      scope: '/',
    });
  }

  var stored = '';
  try { stored = localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { /* ignore */ }

  var needsMigrate = stored !== BUILD;
  var alreadyReloaded = false;
  try { alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === BUILD; } catch (e) { /* ignore */ }

  if (needsMigrate) {
    unregisterAll()
      .then(clearAllCaches)
      .then(function () {
        try { localStorage.setItem(STORAGE_KEY, BUILD); } catch (e) { /* ignore */ }
        if (stored && !alreadyReloaded) {
          try { sessionStorage.setItem(RELOAD_KEY, BUILD); } catch (e) { /* ignore */ }
          global.location.reload();
          return;
        }
        return registerPassThrough();
      })
      .catch(function () { /* offline — page still loads from network */ });
  } else {
    registerPassThrough().catch(function () { /* ignore */ });
  }
})(typeof window !== 'undefined' ? window : self);
