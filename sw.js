const CACHE_NAME = 'srt-translator-v1.1'; // Change version to force update
const urlsToCache = [
  './', // Represents the root index.html
  './index.html',
  './manifest.json',
  './assets/style.css',
  './assets/script.js',
  // Add paths to your icons
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Add CDNs if you want them cached (optional, increases initial load)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/dropzone/5.9.3/dropzone.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/dropzone/5.9.3/dropzone.min.js',
   // Cache Font Awesome fonts (woff2 format is widely supported)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2', // Even if it warns, might be needed
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

// Install event: Cache the app shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell:', urlsToCache);
        // Use addAll for atomic caching
        // Use fetch with cache: 'reload' to bypass HTTP cache for these essential files
        const cachePromises = urlsToCache.map(url => {
            return fetch(url, { cache: 'reload' })
                .then(response => {
                    if (!response.ok) {
                        // Don't cache non-200 responses during install
                        console.error(`[Service Worker] Failed to fetch ${url} during install: ${response.status} ${response.statusText}`);
                        // Throw an error to potentially fail the install if critical files are missing
                        if (url === './' || url === './index.html' || url.endsWith('.js') || url.endsWith('.css')) {
                           throw new Error(`Failed to cache critical resource: ${url}`);
                        }
                        return null; // Don't cache optional/CDN failures
                    }
                    return cache.put(url, response);
                })
                .catch(error => {
                    console.error(`[Service Worker] Error fetching/caching ${url}:`, error);
                     // Re-throw for critical files
                    if (url === './' || url === './index.html' || url.endsWith('.js') || url.endsWith('.css')) {
                        throw error;
                    }
                });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached successfully.');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch(error => {
         console.error('[Service Worker] Caching failed during install:', error);
         // Optional: Force uninstall self if critical caching failed?
         // self.registration.unregister();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients...');
      // Take control of currently open pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event: Serve cached content when offline (Cache-First for cached assets)
self.addEventListener('fetch', event => {
  // Let the browser handle requests for browser extensions or specific schemes.
  if (event.request.url.startsWith('chrome-extension://') || event.request.url.startsWith('moz-extension://')) {
    return;
  }

  // Basic Cache-First Strategy for GET requests
  if (event.request.method === 'GET') {
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            // Return cached response if found
            if (cachedResponse) {
              // console.log('[Service Worker] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            // If not in cache, fetch from network
            // console.log('[Service Worker] Fetching from network:', event.request.url);
            return fetch(event.request)
                .then(networkResponse => {
                    // Optional: Cache dynamically fetched resources if needed
                    // Be careful what you cache here to avoid filling storage
                    // Example: Cache images? CSS from CDNs if not pre-cached?
                    /*
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') { // Only cache basic, same-origin resources
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    }
                    */
                    return networkResponse;
                })
                .catch(error => {
                    console.error('[Service Worker] Network fetch failed:', error, event.request.url);
                    // Optional: Return a custom offline fallback page/response here
                    // if (event.request.mode === 'navigate') { // If it's a page navigation
                    //   return caches.match('/offline.html'); // You'd need an offline.html page cached
                    // }
                });
          })
      );
  }
  // For non-GET requests (like POST to Gemini API/Proxy), just fetch normally
  // The browser handles these; the service worker doesn't intercept unless needed.
});