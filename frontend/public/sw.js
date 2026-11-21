// AICTE FDR Vault - Service Worker
const CACHE_NAME = 'aicte-fdr-vault-v1';
const STATIC_ASSETS = ['/', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Cache-first for static assets, network-first for API requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache authenticated API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets (hashed files, images, scripts): Cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigation: Stale-while-revalidate
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
  }
});

// Clear cache message from app (e.g. on logout)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    });
  }
});
