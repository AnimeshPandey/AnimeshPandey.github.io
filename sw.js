/**
 * Pass-through service worker — does NOT cache HTML, CSS, or JS.
 * Legacy ap-v* workers cached deployables and caused stale portfolio / unstyled Casebook.
 * Cache bust: __AP_BUILD_ID__ (replaced in CI; sw-migrate.js clears old caches on deploy).
 */
var SW_VERSION = '__AP_BUILD_ID__';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Intentionally no "fetch" handler — browser uses normal HTTP cache only. */
