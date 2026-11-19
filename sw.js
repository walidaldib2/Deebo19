const CACHE = "deebo-local-v10-8";

const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js",
  "./qrcode.js",
  "./manifest.json",
  "./icon.svg",
  "./preferences.js",
  "./preferences.css",
  "./biometric.bundle.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (
    event.request.method !== "GET" ||
    url.origin !== location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit => {
      if (hit) return hit;

      return fetch(event.request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE).then(cache => {
              cache.put(event.request, response.clone());
            });
          }

          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
