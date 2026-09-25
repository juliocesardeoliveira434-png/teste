/* ============================================================
   VITRINE PRO — service worker
   Cacheia o shell da aplicação para funcionar offline.
   Estratégia: cache-first para estáticos, network-first para HTML.
   ============================================================ */
var CACHE = 'vitrine-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css', './css/base.css', './css/components.css',
  './css/layout.css', './css/store.css', './css/admin.css', './css/responsive.css',
  './js/lib/dom.js', './js/lib/format.js', './js/lib/rng.js',
  './js/ui/icons.js', './js/ui/art.js', './js/ui/toast.js', './js/ui/modal.js',
  './js/ui/charts.js', './js/ui/components.js',
  './js/data/catalog.js', './js/data/seed.js',
  './js/state/store.js', './js/state/cart.js',
  './js/services/shipping.js', './js/services/payments.js', './js/services/cep.js',
  './js/pages/home.js', './js/pages/catalog.js', './js/pages/product.js',
  './js/pages/cart.js', './js/pages/checkout.js', './js/pages/account.js',
  './js/pages/plans.js', './js/pages/institutional.js', './js/pages/admin.js',
  './js/app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (a) {
        return c.add(a).catch(function () { /* ignora arquivo ausente */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* navegação: tenta rede, cai para o cache */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  /* estáticos: cache primeiro */
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) {
        /* revalida em background */
        fetch(req).then(function (res) {
          if (res && res.status === 200) {
            caches.open(CACHE).then(function (c) { c.put(req, res.clone()); });
          }
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
