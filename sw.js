const CACHE_NAME = 'techtouch0-v2'; // Version updated to ensure the new SW is installed
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/settings.json',
  '/posts.json',
  '/categories.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use { cache: 'reload' } to bypass browser cache for these initial files
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
      .catch(err => {
        console.error('Failed to cache files during install:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('https://kinantech.goatcounter.com')) {
    return;
  }

  const url = new URL(event.request.url);

  // Network-first strategy for API data (JSON files) and the main page.
  // This ensures users always get the latest content when they are online.
  if (url.pathname.endsWith('.json') || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If fetch is successful, cache the new response and return it.
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If fetch fails (e.g., offline), return the cached version as a fallback.
          console.log('Network request failed, serving from cache for:', event.request.url);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets (images, css, js, fonts, etc.).
  // These assets don't change often, so serving from cache is faster.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If it's in the cache, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch from the network, cache it, and return it.
        return fetch(event.request).then(
          (networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(err => {
           console.error('Fetch failed for static asset:', err);
           // You could return a custom offline page here if you have one.
        });
      })
  );
});
