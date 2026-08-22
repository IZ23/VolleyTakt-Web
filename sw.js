const CACHE = 'volleytakt-live-web-v0.3.1-p1d';

// Nur diese Kernressourcen dürfen die Installation des Service Workers blockieren.
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css?v=0.3.1-p1d',
  './manifest.webmanifest',
  './logo.png',
  './assets/volleyball-service.png',
  './js/app.js?v=0.3.1-p1d',
  './js/storage.js?v=0.3.1-p1d',
  './js/sync.js?v=0.3.1-p1d',
  './js/dji-protocol.js?v=0.3.1-p1d',
  './js/dji-ble.js?v=0.3.1-p1d',
  './js/gopro-ble.js?v=0.3.1-p1d',
  './js/i18n.js?v=0.3.1-p1d',
  './js/locales/de.js?v=0.3.1-p1d',
  './js/locales/en.js?v=0.3.1-p1d'
];

// PWA-Icons sind wichtig, aber ein einzelnes fehlendes Icon darf die App nicht offline-unfähig machen.
const OPTIONAL_ASSETS = [
  './app-icons/volleytakt-96.png',
  './app-icons/volleytakt-192.png',
  './app-icons/volleytakt-512.png',
  './app-icons/volleytakt-1024.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);
    await Promise.allSettled(OPTIONAL_ASSETS.map(asset => cache.add(asset)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
