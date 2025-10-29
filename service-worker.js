// Basic Caching Service Worker (v1.4 - No changes needed)
const CACHE_NAME = 'attendance-tracker-cache-v1'; 
const urlsToCache = [
  './', 
  './index.html', 
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Filter out external URLs if any were added
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('http'))); 
      })
      .catch(err => { console.error('Failed to open cache: ', err); })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) { return response; } // Cache hit

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response (ignore chrome-extension:// requests etc.)
            if(!response || response.status !== 200 || !['basic', 'cors'].includes(response.type)) { 
              return response; 
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                 // Only cache local resources explicitly listed or from the same origin
                 if (urlsToCache.includes(event.request.url) || event.request.url.startsWith(self.location.origin)) {
                   cache.put(event.request, responseToCache);
                 }
              });
            return response;
          }
        ).catch(err => {
            console.error('Fetch failed; error:', err);
            // Optional: return caches.match('offline.html'); 
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; 
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
    })
  );
});
