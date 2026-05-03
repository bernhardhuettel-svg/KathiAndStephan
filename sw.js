const CACHE_NAME = 'wedding-app-v3'; // Ein letztes Mal erhöht, um den alten Cache zu sprengen
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// Installieren und Basis-Assets cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // Zwingt den neuen Service Worker, sofort aktiv zu werden
});

// Anfragen abfangen: NETWORK FIRST Strategie
self.addEventListener('fetch', event => {
  // Firebase-Datenbank/Storage-Anfragen NICHT cachen (das macht Firebase intern)
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('api.imgbb.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Wir haben eine frische Antwort aus dem Netz! 
        // Wir geben sie zurück und aktualisieren gleichzeitig den Offline-Cache damit.
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Wir sind offline oder haben mieses Netz (fetch schlägt fehl). 
        // Also greifen wir auf den gespeicherten Cache zurück.
        return caches.match(event.request);
      })
  );
});

// Alte Caches aufräumen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim(); // Übernimmt sofort die Kontrolle über alle offenen Tabs
});
