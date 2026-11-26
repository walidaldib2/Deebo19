const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require("node:path").join(__dirname, "sw.js"), "utf8");
const listeners = {};
const cached = new Map();
const cacheWrites = [];
let deleted = [];
let fetchCalls = 0;
let skipWaitingCalls = 0;
let clientsClaimed = 0;

const cache = {
  addAll: async (files) => { cacheWrites.push(...files); },
  put: async (request, response) => { cached.set(request.url || request, response); }
};
const cachesApi = {
  open: async () => cache,
  keys: async () => ["old-cache", "deebo-local-v10-27"],
  delete: async (key) => { deleted.push(key); return true; },
  match: async (request) => {
    const key = typeof request === "string" ? request : request.url;
    return cached.get(key) || (key === "./index.html" ? { shell: true } : undefined);
  }
};
const self = {
  addEventListener: (name, fn) => { listeners[name] = fn; },
  skipWaiting: async () => { skipWaitingCalls++; },
  clients: { claim: async () => { clientsClaimed++; } }
};
const context = {
  self,
  caches: cachesApi,
  location: { origin: "https://deeb.example" },
  URL,
  Response,
  fetch: async () => { fetchCalls++; throw new Error("offline"); },
  console
};
vm.runInNewContext(source, context, { filename: "sw.js" });

async function main() {
  assert.ok(listeners.install && listeners.activate && listeners.fetch, "Service worker lifecycle handlers must register");

  let installPromise;
  listeners.install({ waitUntil: (promise) => { installPromise = promise; } });
  await installPromise;
  assert.ok(cacheWrites.includes("./index.html"), "Install must cache the application shell");
  assert.ok(cacheWrites.includes("./native-plugins.bundle.js"), "Install must cache the native-plugin fallback");
  assert.ok(cacheWrites.includes("./team-sync.js"), "Install must cache the DEEB19 team sync engine");
  assert.equal(skipWaitingCalls, 1, "Successful install should activate the new worker");

  let activatePromise;
  listeners.activate({ waitUntil: (promise) => { activatePromise = promise; } });
  await activatePromise;
  assert.deepEqual(deleted, ["old-cache", "deebo-local-v10-27"], "Activation must remove all obsolete app caches, including the previous DEEB19 build");
  assert.equal(clientsClaimed, 1, "Activation should claim open clients");

  const crossOrigin = { method: "GET", url: "https://cdn.example/app.js", mode: "cors" };
  let crossOriginHandled = false;
  listeners.fetch({ request: crossOrigin, respondWith: () => { crossOriginHandled = true; } });
  assert.equal(crossOriginHandled, false, "Cross-origin requests must remain outside the app cache handler");

  const post = { method: "POST", url: "https://deeb.example/api", mode: "cors" };
  let postHandled = false;
  listeners.fetch({ request: post, respondWith: () => { postHandled = true; } });
  assert.equal(postHandled, false, "Non-GET requests must remain outside the app cache handler");

  const navigation = { method: "GET", url: "https://deeb.example/reports", mode: "navigate" };
  let navigationResponse;
  listeners.fetch({ request: navigation, respondWith: (promise) => { navigationResponse = promise; } });
  const shell = await navigationResponse;
  assert.equal(shell.shell, true, "Offline navigation should fall back to the cached app shell");

  const asset = { method: "GET", url: "https://deeb.example/missing.js", mode: "no-cors" };
  let assetResponse;
  listeners.fetch({ request: asset, respondWith: (promise) => { assetResponse = promise; } });
  const failedAsset = await assetResponse;
  assert.equal(failedAsset.type, "error", "Missing offline assets must fail instead of returning HTML");
  assert.equal(fetchCalls, 2, "Only same-origin GET requests should attempt network fetches");

  console.log("PASS: service worker install, activation, cache scope, offline navigation, and missing-asset behavior");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
