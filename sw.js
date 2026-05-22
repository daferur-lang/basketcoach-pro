const CACHE = 'basketcoach-v8';
const SCOPE = new URL(self.registration.scope).pathname;
const ASSETS = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json',
  SCOPE + 'js/viewer3d.js',
  SCOPE + 'models/Xbot.glb',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Solo cachea same-origin (no los CDN de Three.js — esos los cachea el browser nativo)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request)
        .then(res => {
          // cachea progresivamente módulos JS y modelos GLB
          if (res.ok && (e.request.url.endsWith('.js') || e.request.url.endsWith('.glb'))) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(SCOPE + 'index.html'))
    )
  );
});
