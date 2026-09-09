const CACHE = 'volleytakt-live-web-v0.4.1';

// Nur diese Kernressourcen dürfen die Installation des Service Workers blockieren.
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css?v=0.4.1',
  './manifest.webmanifest',
  './update-manifest.json',
  './logo.png',
  './assets/volleyball-service.png',
  './js/app.js',
  './js/app/state.js',
  './js/app/selectors.js',
  './js/app/persistence.js',
  './js/app/commands.js','./js/app/input-routing.js','./js/ui/layout/device-layout.js',
  './js/library/metadata.js','./js/data/context.js','./js/analysis/domain.js','./js/analysis/deep.js','./js/analysis/filters.js','./js/analysis/rallies.js','./js/analysis/basic.js','./js/analysis/chains.js','./js/analysis/chains2.js','./js/analysis/context.js','./js/analysis/insights.js','./js/analysis/insights-advanced.js','./js/analysis/opponent.js','./js/analysis/priorities.js','./js/analysis/cache.js','./js/analysis/result-window.js','./js/analysis/team-report.js','./js/analysis/report-export.js','./js/analysis/trainer-report.js','./js/analysis/ui.js',
  './js/camera/service.js',
  './js/scouting/scouting.js',
  './js/scouting/rally.js',
  './js/scouting/events.js','./js/scouting/scoring.js','./js/scouting/match-flow.js','./js/scouting/history.js',
  './js/storage.js',
  './js/sync.js',
  './js/dji-protocol.js',
  './js/i18n.js',
  './js/locales/de.js',
  './js/locales/messages.js',
  './js/locales/legacy-messages.js'
];

// PWA-Icons sind wichtig, aber ein einzelnes fehlendes Icon darf die App nicht offline-unfähig machen.
const OPTIONAL_ASSETS = [
  './js/dji-ble.js',
  './js/gopro-ble.js',
  './app-icons/volleytakt-96.png',
  './app-icons/volleytakt-192.png',
  './app-icons/volleytakt-512.png',
  './app-icons/techniques/aufschlag.png?v=0.4.0-rc5-pictograms',
  './app-icons/techniques/zuspiel.png?v=0.4.0-rc5-pictograms',
  './app-icons/techniques/angriff.png?v=0.4.0-rc5-pictograms',
  './app-icons/techniques/annahme.png?v=0.4.0-rc5-pictograms',
  './app-icons/techniques/abwehr.png?v=0.4.0-rc5-pictograms',
  './app-icons/techniques/block.png?v=0.4.0-rc5-pictograms',
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

self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });

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
      const response = await fetch(event.request, event.request.mode === 'navigate' ? {cache:'no-store'} : {cache:'no-cache'});
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./index.html', {ignoreSearch:true});
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
