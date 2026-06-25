// Service worker: makes Forage installable AND usable offline.
// Strategy:
//   - Navigations: network-first, falling back to the cached app shell (so the
//     app opens with no connection, and the share-target GET still works online).
//   - Same-origin GET assets (hashed JS/CSS/images): stale-while-revalidate.
// Hashed Vite filenames mean cached assets are always safe to serve.

const CACHE = 'forage-v3';
const SHELL = './';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match(SHELL).then((r) => r || caches.match(req))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
