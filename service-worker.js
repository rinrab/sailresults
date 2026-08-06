self.addEventListener("install", (event) => {
  const resources = [
    "/",
    "/out/sailresults.js",
  ];

  const addResourcesToCacheAsync = async () => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
  };

  event.waitUntil(addResourcesToCacheAsync());
});

const fetchWithTimeout = (request, timeout = 3000) => {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
  ]);
};

self.addEventListener('fetch', (event) => {
  const getResponseAsync = async () => {
    try {
      return await fetchWithTimeout(event.request);
    } catch {
      return await caches.match(event.request);
    }
  };

  event.respondWith(getResponseAsync());
});
