const CACHE = "deebo-local-v10-29";

const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./document-tools.js",
  "./ocr/tesseract.min.js",
  "./ocr/worker.min.js",
  "./ocr/core/tesseract-core.wasm.js",
  "./ocr/core/tesseract-core-simd.wasm.js",
  "./ocr/core/tesseract-core-lstm.wasm.js",
  "./ocr/core/tesseract-core-simd-lstm.wasm.js",
  "./ocr/core/tesseract-core.wasm",
  "./ocr/core/tesseract-core-simd.wasm",
  "./ocr/core/tesseract-core-lstm.wasm",
  "./ocr/core/tesseract-core-simd-lstm.wasm",
  "./ocr/core/tesseract-core-relaxedsimd.wasm.js",
  "./ocr/core/tesseract-core-relaxedsimd.wasm",
  "./ocr/core/tesseract-core-relaxedsimd-lstm.wasm.js",
  "./ocr/core/tesseract-core-relaxedsimd-lstm.wasm",
  "./ocr/lang/ara.traineddata",
  "./ocr/lang/eng.traineddata",
  "./powerpoint-editor.js",
  "./db.js",
  "./team-sync.js",
  "./qrcode.js",
  "./manifest.json",
  "./icon.svg",
  "./preferences.js",
  "./preferences.css",
  "./biometric.bundle.js",
  "./native-plugins.bundle.js"
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
        .catch(() => {
        // Only document navigations may fall back to the app shell.
        // Returning HTML for a missing JS/CSS/image asset masks the real failure.
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});