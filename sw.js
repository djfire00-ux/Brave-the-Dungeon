// Brave the Dungeon offline copy: serve from the network when there is one, from the stored copy when there isn't.
const CACHE = 'btd-offline-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match(new URL('./', location.href).href) || await cache.match(new URL('index.html', location.href).href) : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
