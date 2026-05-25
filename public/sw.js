/* MapAble PWA service worker — safe caching only */

const CACHE_VERSION = "mapable-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const SHELL_URLS = ["/offline.html"];

const STATIC_ASSET_PATTERN =
  /\.(js|css|woff2?|png|svg|ico|webp)(\?.*)?$/i;

const SENSITIVE_PATH_PREFIXES = [
  "/api/",
  "/dashboard/documents",
  "/dashboard/invoices",
  "/dashboard/incidents",
  "/dashboard/funding",
  "/dashboard/messages",
  "/admin/",
  "/data-vault/",
];

function isSensitiveRequest(url) {
  const path = new URL(url).pathname;
  return SENSITIVE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("mapable-") && key !== SHELL_CACHE && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  if (request.method !== "GET" || isSensitiveRequest(url)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (STATIC_ASSET_PATTERN.test(new URL(url).pathname)) {
    event.respondWith(staleWhileRevalidateStatic(request));
  }
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function staleWhileRevalidateStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached ?? null);

  if (cached) return cached;

  try {
    const response = await fetchPromise;
    if (response) return response;
  } catch {
    /* fall through */
  }

  return new Response("Offline", {
    status: 503,
    headers: { "Content-Type": "text/plain" },
  });
}
