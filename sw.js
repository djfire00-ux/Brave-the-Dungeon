// Keeps the game on the phone so it opens with no internet. Bump happens on every build.
const CACHE = 'brave-dungeon-202610241503';
const SOUNDS = 'brave-dungeon-sounds-v1'; // music: kept between updates (only downloaded once per track)
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== SOUNDS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// offline first: answer from the phone, and fetch a fresh copy in the background for next time
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/sounds/')) {
    // music tracks: from the phone if we have them, otherwise download once and keep
    e.respondWith(caches.open(SOUNDS).then(async c => {
      const key = e.request.url.split('?')[0];
      const hit = await c.match(key);
      if (hit) return hit;
      const r = await fetch(key); // the whole file (no byte ranges), so it can be kept
      if (r && r.status === 200) { try { await c.put(key, r.clone()); } catch (err) {} }
      return r;
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || c.match('./index.html');
  }));
});
