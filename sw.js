const CACHE = 'ap-v21';
const ASSETS = [
  '/',
  '/assets/theme.css',
  '/assets/site.css',
  '/assets/theme.js',
  '/assets/nav.js',
  '/assets/visuals.js',
  '/assets/contact.js',
  /* recruiter panel — lazy-loaded, cache for offline */
  '/assets/profile-facts.js',
  '/assets/recruiter-data.js',
  '/assets/recruiter.js',
  '/assets/recruiter.css',
  /* easter eggs — lazy-loaded per device tier */
  '/assets/eggs.css',
  '/assets/eggs-data.js',
  '/assets/eggs-mobile.js',
  '/assets/eggs-tablet.js',
  '/assets/eggs-desktop.js',
  '/favicon.svg',
  '/assets/og-image.png',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  /* Only handle same-origin GET requests */
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  /* HTML: network-first (always fresh content, falls back to cache) */
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(function (res) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          return res;
        })
        .catch(function () { return caches.match(e.request); })
    );
    return;
  }

  /* Assets: cache-first */
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      });
    })
  );
});
