// Service Worker for offline support and performance caching
const CACHE_NAME = 'mgos-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

const API_CACHE = 'mgos-api-v1';
const API_ROUTES = [
  '/api/tasks',
  '/api/sprints',
  '/api/users',
  '/api/preferences',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Gracefully handle missing assets during development
        console.warn('Service Worker: Some static assets not available');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement network-first strategy for APIs, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API routes: network-first with fallback to cache
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cache = caches.open(API_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached response or offline message
          return caches.match(request).then((response) => {
            return response || new Response('Offline - cached data not available', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for tasks queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      fetch('/api/tasks')
        .then((response) => {
          if (response.ok) {
            return caches.open(API_CACHE).then((cache) => {
              cache.put('/api/tasks', response.clone());
            });
          }
        })
        .catch(() => {
          console.log('Service Worker: Background sync failed - offline');
        })
    );
  }
});
