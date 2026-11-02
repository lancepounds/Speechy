const CACHE = 'speechy-shell-v1';
const BASE = new URL('./', self.location.href);
const SHELL = ['./','./index.html','./train-talk.html','./pwa.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'].map(path => new URL(path, BASE).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
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
      const response = await fetch(request);
      if (response.ok) await cache.put(url.origin + url.pathname, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(url.origin + url.pathname);
      if (cached) return cached;
      throw error;
    }
  })());
});