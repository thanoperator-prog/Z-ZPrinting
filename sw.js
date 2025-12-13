const CACHE_NAME = 'zz-printing-v14';

// Critical resources. The SW will fail to install if any of these are missing.
// We now use a SPECIFIC version of Lucide to ensure offline caching works perfectly.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

// Optional resources (like icons). We try to cache them, but if they fail
// (e.g., file missing), we still allow the app to install.
const OPTIONAL_ASSETS = [
  './icon-512.png'
];

// Install Event: Caches the basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Attempt to cache optional assets (don't stop install if they fail)
      cache.addAll(OPTIONAL_ASSETS).catch(console.warn);
      
      // Must cache core assets for offline to work
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleans up old caches when a new version of sw.js is deployed
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: The caching strategy
// 1. For HTML pages: Network First (try to get latest, fall back to cache)
// 2. For assets/images/libs: Cache First (try cache, fall back to network)
self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML) -> Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Asset requests -> Cache First, then Network (and update cache)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
           return response;
        }

        // Clone and cache the new resource
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});