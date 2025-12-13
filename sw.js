const CACHE_NAME = 'zz-printing-v7';

// Assets to cache immediately
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
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We use {cache: 'reload'} to ensure we get fresh copies from the server
      // during the installation phase
      return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
    })
  );
});

// Activate Event: Clean up old caches
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
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch Event: Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
  // Handle Navigation Requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to return the cached index.html
          // We search for './index.html' explicitly
          return caches.match('./index.html')
            .then(response => {
              // If exact match found, return it
              if (response) return response;
              // If not, try matching the root './' as a fallback
              return caches.match('./');
            });
        })
    );
    return;
  }

  // Handle Assets (Images, Scripts, Styles)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        // Cache the new asset for next time
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});