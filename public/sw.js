/* SMH Member PWA — installable shell only (no offline cache).
 * Do NOT respondWith() API / banners / non-GET: avoids auth bugs + image latency. */
const SW_REV = 3;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/banners/")
  ) {
    return; // browser default
  }
  event.respondWith(fetch(event.request));
});

void SW_REV;
