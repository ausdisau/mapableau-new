/* MapAble service worker — safe caching only; no sensitive API/HTML by default */

const SW_VERSION = "mapable-v1";
const SHELL_CACHE = `${SW_VERSION}-shell`;
const STATIC_CACHE = `${SW_VERSION}-static`;

/** App shell and public assets safe to precache */
const PRECACHE_URLS = ["/offline.html", "/icons/mapable-icon-192.png"];

/** Path prefixes that must never be cached */
const NO_CACHE_PREFIXES = [
  "/api/",
  "/auth/",
  "/login",
  "/register",
  "/admin",
  "/dashboard/messages",
  "/data-vault",
];

/** Sensitive path fragments — block cache even for GET */
const NO_CACHE_SEGMENTS = [
  "/invoice",
  "/invoices",
  "/incident",
  "/clinical",
  "/ndis-plan",
  "/participant-profile",
  "/payment",
];

function shouldNeverCache(url) {
  const path = new URL(url).pathname;
  if (NO_CACHE_PREFIXES.some((p) => path.startsWith(p))) return true;
  if (NO_CACHE_SEGMENTS.some((s) => path.includes(s))) return true;
  return false;
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

function isSafeStaticAsset(url) {
  const path = new URL(url).pathname;
  if (shouldNeverCache(url)) return false;
  return (
    path.startsWith("/icons/") ||
    path.startsWith("/brand/") ||
    path.endsWith(".css") ||
    (path.startsWith("/_next/static/") && !path.includes("chunks/app"))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("mapable-") && k !== SHELL_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = request.url;
  if (!url.startsWith(self.location.origin)) return;
  if (shouldNeverCache(url)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isSafeStaticAsset(url)) {
    event.respondWith(staleWhileRevalidateStatic(request));
    return;
  }
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match("/offline.html");
    if (cached) return cached;
    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
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
    .catch(() => null);

  const network = await fetchPromise;
  if (network) return network;
  if (cached) return cached;
  return fetch(request);
}
