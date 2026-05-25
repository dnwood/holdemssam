const CACHE_NAME = 'holdemssam-v4';
const ASSETS = [
  '/holdemssam/',
  '/holdemssam/index.html',
  '/holdemssam/manifest.json',
  '/holdemssam/icon-192.png',
  '/holdemssam/icon-512.png',
  '/holdemssam/js/i18n.js',
  '/holdemssam/js/data.js',
  '/holdemssam/js/app.js',
  '/holdemssam/js/simulator.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
