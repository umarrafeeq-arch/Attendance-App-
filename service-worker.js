// Basic Caching Service Worker v2 (Improved Error Handling)
const CACHE_NAME = 'attendance-tracker-cache-v2';
// Add URLs of assets you want to cache. For a single HTML file, just '/' or './index.html'
const urlsToCache = [
  './', // Cache the main page (index.html)
  './index.html', // Explicitly cache index.html
  // Add other assets like CSS or JS files if they were separate
];

// Install event: Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all URLs to the cache. Filter out external URLs if any.
        const localUrls = urlsToCache.filter(url => !url.startsWith('http'));
        return cache.addAll(localUrls); 
      })
      .catch(err => {
         console.error('Failed to open cache during install: ', err);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Fetch event: Serve from cache first, then network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                 // Cache the new resource only if it's one of our app's core files or local assets
                 if (urlsToCache.includes(event.request.url) || event.request.url.startsWith(self.location.origin)) {
                   cache.put(event.request, responseToCache);
                 }
              });

            return response;
          }
        ).catch(err => {
            console.error('Fetch failed; returning offline fallback if available.', err);
            // Optionally, return a basic offline fallback page if network fails
            // return caches.match('offline.html'); 
        });
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Keep only the current cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of currently open clients immediately
  );
});

