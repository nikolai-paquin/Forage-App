// Minimal service worker — enables PWA install (and thus the mobile share target).
// No offline caching yet; just a passthrough.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
