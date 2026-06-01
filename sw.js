const CACHE = 'ap-v34';
const ASSETS = [
  '/',
  /* Design system — load order: foundation → theme → shell → site */
  '/assets/styles/foundation.css',
  '/assets/theme.css',
  '/assets/platform/chrome.css',
  '/assets/platform/prefs-chrome.css',
  '/assets/platform/shell.css',
  '/assets/styles/components/button.css',
  '/assets/site.css',
  /* JS — constants first, then platform chrome, then modules */
  '/assets/js/constants.js',
  '/assets/platform/chrome.js',
  '/assets/platform/prefs-chrome.js',
  '/assets/platform/theme-bridge.js',
  '/assets/platform/display-menu.js',
  '/assets/theme.js',
  '/assets/nav.js',
  '/assets/visuals.js',
  '/assets/contact.js',
  /* i18n engine + priority locales */
  '/assets/i18n/i18n.js',
  '/assets/i18n/locales/en.json',
  '/assets/i18n/locales/hi.json',
  '/assets/i18n/locales/es.json',
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

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function networkFirst(request) {
  return fetch(request)
    .then(function (res) {
      if (res && res.ok) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(request, clone); });
      }
      return res;
    })
    .catch(function () { return caches.match(request); });
}

/** Always prefer network for deployable text assets so reviewers never see stale UI. */
function wantsNetworkFirst(url) {
  var p = url.pathname;
  if (p.indexOf('/cases/') === 0) return true;
  if (p.indexOf('/assets/platform/') === 0) return true;
  if (p === '/assets/contact.js') return true;
  if (p === '/assets/theme.js' ||
      p === '/assets/visuals.js' ||
      p === '/assets/recruiter.js' ||
      p === '/assets/i18n/i18n.js' ||
      p.indexOf('/assets/i18n/locales/') === 0) {
    return true;
  }
  if (/\.(css|js|json|mjs)$/.test(p)) return true;
  return false;
}

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  /* Only handle same-origin GET requests */
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  /* HTML: network-first (always fresh content, falls back to cache) */
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  /* CSS, JS, Casebook, platform chrome: network-first */
  if (wantsNetworkFirst(url)) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  /* Images & fonts: cache-first (large, change rarely) */
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      });
    })
  );
});
