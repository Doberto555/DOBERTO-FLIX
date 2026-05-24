// DOBERTO-FLIX Service Worker v3.0
// VERSION ap chanje otomatikman chak fwa - pa cache index.html
const VERSION = Date.now(); // chanje chak fwa sw.js chaje
const CACHE_NAME = `doberto-v${VERSION}`;

self.addEventListener('install', e => {
  // Pa cache anyen pandan installation - toujou pran dènye vèsyon
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Efase tout vye cache yo
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Pa janm cache API calls yo
  if (url.includes('api.themoviedb.org') ||
      url.includes('image.tmdb.org') ||
      url.includes('api.vimeo.com') ||
      url.includes('supabase.co') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('catbox.moe')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Pa janm cache index.html - toujou pran dènye vèsyon
  if (url.endsWith('/') || url.includes('index.html') || url.endsWith('.app') || url.endsWith('.app/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Lòt fichye (favicon, manifest) - network first
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(
    data.title || '🎬 DOBERTO-FLIX',
    {
      body: data.body || "De nouveaux films t'attendent!",
      icon: data.icon || './favicon.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '.' },
      actions: [
        { action: 'open', title: '▶ Regarder' },
        { action: 'dismiss', title: 'Plus tard' }
      ]
    }
  ));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('.');
    })
  );
});
