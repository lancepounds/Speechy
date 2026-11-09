const CACHE = 'speechy-shell-v19';
const BASE = new URL('./', self.location.href);
const SHELL = ['./','./index.html','./pwa.js','./storage.js','./backup.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'].map(path => new URL(path, BASE).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(url => new Request(url, {cache:'reload'})))));
});
// Let an existing session finish before activating a new version.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('speechy-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !SHELL.includes(url.origin + url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      let response;
      try { response = await fetch(request, {signal:controller.signal}); }
      finally { clearTimeout(timer); }
      if (!response.ok) throw Error('App download failed: ' + response.status);
      if (response.ok) await cache.put(url.origin + url.pathname, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(url.origin + url.pathname);
      if (cached) return cached;
      throw error;
    }
  })());
});









