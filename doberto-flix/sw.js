// DOBERTO-FLIX Service Worker v1.0
const CACHE_NAME = 'doberto-v1';
const ASSETS = ['/'];

// Installation — cache paj prensipal la
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon — netwaye vye cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — sèvi depi cache si offline
self.addEventListener('fetch', e => {
  // Pa cache API TMDB ak imaj ekstèn
  if (e.request.url.includes('api.themoviedb.org') ||
      e.request.url.includes('image.tmdb.org') ||
      e.request.url.includes('fonts.googleapis.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Notifikasyon push
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🎬 DOBERTO-FLIX';
  const options = {
    body: data.body || 'De nouveaux films t\'attendent!',
    icon: data.icon || 'https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    badge: 'https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open',    title: '▶ Regarder' },
      { action: 'dismiss', title: 'Plus tard'  },
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Klike sou notifikasyon → ouvri app la
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
