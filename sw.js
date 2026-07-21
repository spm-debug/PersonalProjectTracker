// Service worker: permite que la app funcione sin internet.
// La app (index.html) se busca primero en la red para recibir actualizaciones;
// si no hay conexión, se sirve la copia guardada.
const CACHE = 'vida-tracker-cache-v10';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(['./', './index.html', './icon.png', './manifest.webmanifest']); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (claves) {
        return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function (r) {
          const copia = r.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copia); });
          return r;
        })
        .catch(function () { return caches.match('./index.html'); })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function (r) { return r || fetch(e.request); })
    );
  }
});
