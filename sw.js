// Offline support. Online, everything comes from the network as usual, so a new version is never held back.
// Offline, the copy kept from the last visit is used. The list below is kept on install so that every scene
// works offline even if it has not been visited yet; a unit test keeps the list in step with the files.
const CACHE = 'curphey-v1';
const ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/pieces/tower/vendor/three.js',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-48.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/pieces/voyage/boat.js',
  '/pieces/voyage/chapter.mjs',
  '/pieces/voyage/eggs.js',
  '/pieces/voyage/palette.mjs',
  '/pieces/voyage/passage.mjs',
  '/pieces/voyage/people.mjs',
  '/pieces/voyage/project.mjs',
  '/pieces/voyage/save.mjs',
  '/pieces/voyage/sound.mjs',
  '/pieces/voyage/style.css',
  '/pieces/voyage/terminal.js',
  '/pieces/voyage/text.mjs',
  '/pieces/voyage/walker.js',
  '/pieces/voyage/world.js',
  '/pieces/voyage/yacht.js',
  '/pieces/voyage/chapters/bridge-scene.js',
  '/pieces/voyage/chapters/bridge.mjs',
  '/pieces/voyage/chapters/departure.mjs',
  '/pieces/voyage/chapters/founders-scene.js',
  '/pieces/voyage/chapters/founders.mjs',
  '/pieces/voyage/chapters/index.mjs',
  '/pieces/voyage/chapters/monterey-scene.js',
  '/pieces/voyage/chapters/monterey.mjs',
  '/pieces/voyage/chapters/needle-scene.js',
  '/pieces/voyage/chapters/needle.mjs',
  '/pieces/voyage/chapters/pier-scene.js',
  '/pieces/voyage/chapters/pier.mjs',
  '/pieces/voyage/chapters/sausalito-scene.js',
  '/pieces/voyage/chapters/sausalito.mjs',
  '/pieces/voyage/chapters/scenes.js',
  '/pieces/voyage/chapters/trinidad-scene.js',
  '/pieces/voyage/chapters/trinidad.mjs',
  '/pieces/voyage/render/kit.js',
  '/pieces/voyage/render/pipeline.js',
  '/pieces/voyage/render/textures.js',
  '/pieces/voyage/render/water.js'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(c => c.put(request.mode === 'navigate' ? url.pathname : request, copy)); }
      return response;
    }).catch(() => caches.match(request.mode === 'navigate' ? url.pathname : request, { ignoreSearch: true }).then(hit => hit ?? caches.match('/')))
  );
});
