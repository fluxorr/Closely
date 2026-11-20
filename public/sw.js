// Retire the old offline cache, which could retain private room API responses.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith('closely-')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
