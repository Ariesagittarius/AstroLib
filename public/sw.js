const CACHE_VERSION = 'astrolib-pwa-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const PACK_CACHE = `${CACHE_VERSION}-pack`;

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/astrolib-logo.webp',
  '/favicon.svg'
];

const MAX_RUNTIME_ITEMS = 60;

async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const deleteCount = keys.length - maxItems;
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (err) {

  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('astrolib-') && !key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__') ||
    url.hostname.includes('trycloudflare.com') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('api.deepseek.com')
  ) {
    return;
  }

  const isStaticAsset = (
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.includes('/_astro/') ||
    url.pathname.includes('katex.min.css')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  const isDataJson = url.pathname.startsWith('/data/') || url.pathname.startsWith('/ai-index/');

  if (isNavigation || isDataJson) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, copy);
              trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS);
            });
          }
          return networkResponse;
        })
        .catch(async () => {

          let cachedResponse = await (await caches.open(RUNTIME_CACHE)).match(request);
          if (cachedResponse) return cachedResponse;

          try {
            const packCache = await caches.open(PACK_CACHE);
            cachedResponse = await packCache.match(request);
            if (!cachedResponse) {

              const altPath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname + '/';
              cachedResponse = await packCache.match(altPath);
            }
            if (cachedResponse) return cachedResponse;
          } catch (e) {}

          cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          if (isNavigation) {
            const offlinePage = await caches.match('/offline.html');
            if (offlinePage) {
              return offlinePage;
            }
          }

          return new Response(JSON.stringify({ error: 'offline', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CLEAR_PACK_CACHE') {
    try {
      await caches.delete(PACK_CACHE);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    } catch (err) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: String(err) });
      }
    }
  } else if (data.type === 'GET_PACK_COUNT') {
    try {
      const packCache = await caches.open(PACK_CACHE);
      const keys = await packCache.keys();
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ count: keys.length });
      }
    } catch {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ count: 0 });
      }
    }
  }
});
