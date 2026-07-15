/* Raaga Live service worker — caches the app shell so it opens instantly
   and works offline (translation/identification still need internet). */
const CACHE = "raaga-live-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // App shell: cache-first. Everything cross-origin (fonts, APIs): network,
  // falling back to cache if it was ever cached.
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request))
    );
  }
});
