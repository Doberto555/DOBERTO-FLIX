// DOBERTO-FLIX Service Worker v4.0
const CACHE_NAME = 'doberto-v' + Date.now();
const OFFLINE_CACHE = 'doberto-offline-v1'; // Pòstè fim — pèmanan

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== OFFLINE_CACHE) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Pòstè /w342 — cache pèmanan (offline)
  if (url.includes('image.tmdb.org') && url.includes('/w342')) {
    e.respondWith(caches.open(OFFLINE_CACHE).then(async cache => {
      var cached = await cache.match(e.request);
      if (cached) return cached;
      try {
        var resp = await fetch(e.request);
        if (resp.ok) cache.put(e.request, resp.clone());
        return resp;
      } catch(err) { return new Response('', {status:503}); }
    }));
    return;
  }

  // API calls — toujou network
  if (url.includes('api.themoviedb.org') || url.includes('api.vimeo.com') ||
      url.includes('supabase.co') || url.includes('vidsrc') ||
      url.includes('catbox.moe') || url.includes('embed.su')) {
    e.respondWith(fetch(e.request).catch(() => new Response('',{status:503})));
    return;
  }

  // index.html — toujou fre
  if (url.endsWith('/') || url.includes('index.html') || url.endsWith('.app') || url.endsWith('.app/')) {
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(() => caches.match(e.request)));
    return;
  }

  // Lòt fichye
  e.respondWith(fetch(e.request,{cache:'no-cache'}).catch(() => caches.match(e.request)));
});

// Efase pòstè si moun retire yon fim
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'DELETE_OFFLINE_CACHE' && e.data.url) {
    caches.open(OFFLINE_CACHE).then(c => c.delete(e.data.url));
  }
});

// Push notif
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title||'🎬 DOBERTO-FLIX', {
    body: data.body||"De nouveaux films t'attendent!",
    icon: data.icon||'./favicon.svg',
    vibrate: [200,100,200],
    data: {url: data.url||'.'},
    actions: [{action:'open',title:'▶ Regarder'},{action:'dismiss',title:'Plus tard'}]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action==='dismiss') return;
  e.waitUntil(clients.matchAll({type:'window'}).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow('.');
  }));
});
