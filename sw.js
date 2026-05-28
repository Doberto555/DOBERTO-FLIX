// DOBERTO-FLIX Service Worker v4.0 — Offline Support
const VERSION = Date.now();
const CACHE_NAME = `doberto-v${VERSION}`;
const OFFLINE_CACHE = 'doberto-offline-v1'; // Cache pòstè fim yo — PÈMANAN

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        // Efase vye cache yo MEN KITE offline cache a
        if (k !== OFFLINE_CACHE && k.startsWith('doberto-v')) {
          return caches.delete(k);
        }
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // ── Offline cache (pòstè fim yo) — Cache first ──
  if (url.includes('image.tmdb.org') && url.includes('/w342')) {
    e.respondWith(
      caches.open(OFFLINE_CACHE).then(async cache => {
        var cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          var resp = await fetch(e.request);
          if (resp.ok) cache.put(e.request, resp.clone());
          return resp;
        } catch(err) {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // ── Pa janm cache API calls yo ──
  if (url.includes('api.themoviedb.org') ||
      url.includes('api.vimeo.com') ||
      url.includes('supabase.co') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('catbox.moe') ||
      url.includes('vidsrc') ||
      url.includes('embed.su') ||
      url.includes('2embed')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // ── Pa janm cache index.html ──
  if (url.endsWith('/') || url.includes('index.html') || url.endsWith('.app') || url.endsWith('.app/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── Lòt fichye (favicon, manifest) — network first ──
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .catch(() => caches.match(e.request))
  );
});

// ── Mesaj pou netwaye cache ofline (si itilizatè retire yon fim) ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'DELETE_OFFLINE_CACHE') {
    var urlToDelete = e.data.url;
    if (urlToDelete) {
      caches.open(OFFLINE_CACHE).then(cache => cache.delete(urlToDelete));
    }
  }
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
