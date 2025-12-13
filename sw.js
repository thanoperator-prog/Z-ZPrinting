const CACHE_NAME = 'motor-pms-v4';
const ASSETS = [
  './',
  './index.html',
  './icon-512.png',
  // Use Request objects with 'cors' mode to prevent opaque response issues with <script crossorigin>
  new Request('https://cdn.tailwindcss.com', { mode: 'cors' }),
  new Request('https://unpkg.com/react@18/umd/react.production.min.js', { mode: 'cors' }),
  new Request('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', { mode: 'cors' }),
  new Request('https://unpkg.com/@babel/standalone/babel.min.js', { mode: 'cors' }),
  new Request('https://unpkg.com/lucide@latest', { mode: 'cors' }),
  new Request('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js', { mode: 'cors' }),
  new Request('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js', { mode: 'cors' }),
  new Request('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js', { mode: 'cors' })
];

// Install Event
self.addEventListener('install', (e) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();

  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(err => {
      console.error('SW Install Failed! Check if all assets (like icon-512.png) exist.', err);
    })
  );
});

// Activate Event - Cleanup old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim()) // Immediately control open clients
  );
});

// Fetch Event (Offline Capability)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      // Return cached response if found, else fetch from network
      return res || fetch(e.request).catch(() => {
        // If network fails (offline) and it's a navigation request, return index.html
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});