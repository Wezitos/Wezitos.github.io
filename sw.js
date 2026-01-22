const CACHE_NAME = 'workout-app-v2';

// Core assets that MUST be cached for the app to start
const INITIAL_CACHE = [
  './',
  './index.html',
  './manifest.json',
  '/favicon.ico',
  './react.production.min.js',
  './react-dom.production.min.js',
  './babel.min.js',
  './tailwind.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  './music.mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We try to add all, but if music.mp3 is missing locally, we don't want to break the whole app.
      // However, for a robust PWA, we usually want all or nothing.
      return cache.addAll(INITIAL_CACHE).catch(err => {
          console.error('Failed to cache assets during install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 1. Return cached response if found
      if (response) {
        return response;
      }

      // 2. If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Check if valid response (basic or cors for CDNs)
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }
        
        // 3. Clone and cache the new resource (Dynamic Caching)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});