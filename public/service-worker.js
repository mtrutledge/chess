var dataCacheName = 'pwa-chess-Data-v1.0';
var cacheName = 'pwa-chess';
var filesToCache = [
  '/',
  '/index.html',
  '/game.html',
  '/js/app.js',
  '/js/bootstrap.min.js',
  '/js/chess.min.js',
  '/js/chessboard-0.3.0.min.js',
  '/js/jquery.min.js',
  '/js/jquery.min.map',
  '/js/waitDialog.js',
  '/css/bootstrap.min.css',
  '/css/bootstrap.min.css.map',
  '/css/chessboard-0.3.0.min.css',
  '/css/style.css',
  '/fonts/glyphicons-halflings-regular.eot',
  '/fonts/glyphicons-halflings-regular.svg',
  '/fonts/glyphicons-halflings-regular.ttf',
  '/fonts/glyphicons-halflings-regular.woff',
  '/fonts/glyphicons-halflings-regular.woff2',
  '/img/default/background.jpg',
  '/img/chesspieces/wikipedia/bB.png',
  '/img/chesspieces/wikipedia/bK.png',
  '/img/chesspieces/wikipedia/bN.png',
  '/img/chesspieces/wikipedia/bP.png',
  '/img/chesspieces/wikipedia/bQ.png',
  '/img/chesspieces/wikipedia/bR.png',
  '/img/chesspieces/wikipedia/wB.png',
  '/img/chesspieces/wikipedia/wK.png',
  '/img/chesspieces/wikipedia/wN.png',
  '/img/chesspieces/wikipedia/wP.png',
  '/img/chesspieces/wikipedia/wQ.png',
  '/img/chesspieces/wikipedia/wR.png',
];

self.addEventListener('install', function(e) {
  console.log('[Service Worker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[Service Worker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
