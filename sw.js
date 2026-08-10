// Service worker: permite que la app funcione sin internet.
// La app se busca primero en la red para recibir actualizaciones;
// si no hay conexion, se sirve la copia guardada.
const CACHE = 'vida-tracker-cache-v39';

// Clave canonica de la pagina. Es el start_url del manifest y lo que pide
// realmente el navegador al abrir la app, asi que guardamos y leemos SIEMPRE aqui.
const PAGINA = './';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll([PAGINA, './index.html', './icon.png', './manifest.webmanifest']); })
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

// Guarda en cache solo respuestas realmente buenas. Sin este filtro, un error
// del servidor o una redireccion podian quedar guardados y luego mostrarse
// en lugar de la app cuando no hay internet.
function esGuardable(r) {
  return !!r && r.ok && r.status === 200 && !r.redirected &&
    (r.type === 'basic' || r.type === 'default') &&
    (r.headers.get('content-type') || '').indexOf('text/html') !== -1;
}

self.addEventListener('fetch', function (e) {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function (r) {
          if (esGuardable(r)) {
            const copia = r.clone();
            caches.open(CACHE).then(function (c) { c.put(PAGINA, copia); });
          }
          return r;
        })
        .catch(function () {
          // Sin conexion: servimos la copia guardada (con respaldo por si acaso)
          return caches.match(PAGINA).then(function (r) {
            return r || caches.match('./index.html');
          });
        })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function (r) { return r || fetch(e.request); })
    );
  }
});
