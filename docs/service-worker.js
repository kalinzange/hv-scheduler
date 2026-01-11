const CACHE_NAME = "gcc-scheduler-cache-v2";
const OFFLINE_ASSETS = [
  "/hv-scheduler/",
  "/hv-scheduler/index.html",
  "/hv-scheduler/manifest.webmanifest",
  "/hv-scheduler/vite.svg",
  "/hv-scheduler/icons/icon-192.png",
  "/hv-scheduler/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip caching for non-HTTP(S) requests (chrome-extension, etc.)
  if (!event.request.url.startsWith("http")) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match("/hv-scheduler/index.html"));
    })
  );
});
