const CACHE_NAME = 'zz-printing-v2';

// Add the external libraries you use to the cache list
// so the app works even if offline
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// Install Event: Caches the basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
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
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Asset requests -> Cache First, then Network (and update cache)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        // Don't cache bad responses
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