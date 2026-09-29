// public/sw.js - V2aAttendence PWA Service Worker with Automatic Live Updates
const CACHE_NAME = 'v2a-attendance-v2.7';
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/v2_n.png',
  '/icon.png'
];

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim all active clients immediately so updates apply instantly
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Purge old outdated caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// Network-First for HTML navigation and API to ensure immediate live updates
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Network-First for HTML navigation and Next.js data
  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, fonts, scripts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for skipWaiting command from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
