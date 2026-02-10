const VERSION = "v4";
const HTML_CACHE = `hv-html-${VERSION}`;
const ASSET_CACHE = `hv-assets-${VERSION}`;
const META_CACHE = `hv-meta-${VERSION}`;
const OFFLINE_URL = "/hv-scheduler/index.html";
const VERSION_URL = "/hv-scheduler/version.json";

// Install: pre-cache the minimal offline shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(HTML_CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

// Activate: enable navigation preload and remove old caches only
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration?.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {}
      }
      const keys = await caches.keys();
      const keep = new Set([HTML_CACHE, ASSET_CACHE, META_CACHE]);
      await Promise.all(
        keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)),
      );

      // Also check for version updates on activation as a fallback
      await checkAndPurgeIfVersionChanged();
    })(),
  );
  self.clients.claim();
});

// Helper: Check for version updates and purge cache if needed
async function checkAndPurgeIfVersionChanged() {
  try {
    const meta = await caches.open(META_CACHE);
    const prevResp = await meta.match(VERSION_URL);
    const netResp = await fetch(VERSION_URL, { cache: "no-store" });

    if (netResp && netResp.ok) {
      const curr = await netResp.clone().json();
      let prev = null;

      if (prevResp) {
        try {
          prev = await prevResp.clone().json();
        } catch {}
      }

      // Always update the cached version metadata
      await meta.put(VERSION_URL, netResp);

      // If version changed, purge content caches and notify all clients
      if (prev && prev.version !== curr.version) {
        console.log(
          `[SW] Version update detected: ${prev.version} → ${curr.version}`,
        );
        await caches.delete(HTML_CACHE);
        await caches.delete(ASSET_CACHE);
        broadcastMessage("VERSION_UPDATED", {
          previous: prev.version,
          current: curr.version,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn("[SW] Version check failed:", err);
  }
}

// Fetch strategy:
// - HTML (navigations): network-first with navigation preload, cache updated; fallback to offline shell
// - Hashed assets (scripts/styles/images/fonts): cache-first with background revalidation
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-HTTP(S) and non-GET requests
  if (!request.url.startsWith("http")) return;
  if (request.method !== "GET") return;

  const isNavigate = request.mode === "navigate";

  if (isNavigate) {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          const response =
            preload || (await fetch(request, { cache: "no-store" }));
          const cache = await caches.open(HTML_CACHE);
          // Keep a copy of the latest shell for offline use
          cache.put(OFFLINE_URL, response.clone());

          // Check for version updates on every navigation
          event.waitUntil(checkAndPurgeIfVersionChanged());

          return response;
        } catch {
          const cached = await caches.match(OFFLINE_URL);
          if (cached) return cached;
          return new Response("Offline", { status: 503 });
        }
      })(),
    );
    return;
  }

  const destination = request.destination;
  const isStaticAsset = ["script", "style", "image", "font"].includes(
    destination,
  );

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          // Revalidate in the background
          event.waitUntil(
            (async () => {
              try {
                const fresh = await fetch(request);
                const cache = await caches.open(ASSET_CACHE);
                await cache.put(request, fresh.clone());
              } catch {}
            })(),
          );
          return cached;
        }
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(ASSET_CACHE);
          await cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          // If fetch fails, return any cached version if exists
          const fallback = await caches.match(request);
          if (fallback) return fallback;
          throw err;
        }
      })(),
    );
    return;
  }

  // Default: network-first, fallback to cache
  event.respondWith(
    (async () => {
      try {
        return await fetch(request, { cache: "no-store" });
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("Network error and no cache available");
      }
    })(),
  );
});

function broadcastMessage(type, data) {
  self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((clients) => {
      for (const client of clients) {
        client.postMessage({ type, data });
      }
    })
    .catch(() => {});
}
