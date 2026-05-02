/* eslint-disable */
// ============================================================
// Learner — Service Worker
// ============================================================
// Strategy:
//   - Pyodide CDN (cdn.jsdelivr.net/pyodide/...): cache-first,
//     persistent. First load downloads ~30MB; subsequent sessions
//     (subway, plane, low signal) load instantly from cache.
//   - Same-origin static (JS/CSS/fonts/images): cache-first.
//   - Same-origin navigations (HTML): network-first; on failure,
//     fall back to the most recently cached version of that URL,
//     then to the cached "/" shell, then to a tiny offline page.
//   - Everything else: passthrough.
//
// Bump the CACHE_VERSION to invalidate old caches on deploy.
// ============================================================

const CACHE_VERSION = "v1";
const SHELL_CACHE = `learner-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `learner-static-${CACHE_VERSION}`;
const PYODIDE_CACHE = `learner-pyodide-${CACHE_VERSION}`;

const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Offline · Learner</title>
<style>
  body{margin:0;background:#0d0d14;color:#e8e8f0;font-family:system-ui,-apple-system,sans-serif;
       display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px;text-align:center}
  h1{margin:0 0 8px;font-size:20px}
  p{margin:0;color:#9999b8;font-size:14px;max-width:320px}
  a{color:#4f8ef7;text-decoration:none}
</style></head><body>
<div>
  <h1>You're offline</h1>
  <p>Open a lesson you've already visited and it'll load from cache. Or wait for signal — your progress is saved locally.</p>
</div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old version caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.endsWith(`-${CACHE_VERSION}`))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isPyodideRequest(url) {
  return (
    url.hostname === "cdn.jsdelivr.net" &&
    url.pathname.includes("/pyodide/")
  );
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|webp|avif|gif)$/.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok && res.status === 200) {
      // Don't await put — let it happen in background
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirstNavigation(request) {
  try {
    const res = await fetch(request);
    // Cache successful HTML responses for offline fallback
    if (res && res.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const exact = await cache.match(request);
    if (exact) return exact;
    const root = await cache.match("/");
    if (root) return root;
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // 1. Pyodide CDN — cache-first, persistent.
  if (isPyodideRequest(url)) {
    event.respondWith(cacheFirst(req, PYODIDE_CACHE));
    return;
  }

  // 2. Same-origin static assets — cache-first.
  if (isSameOrigin(url) && isStaticAsset(url)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // 3. Same-origin navigations — network-first with offline fallback.
  if (isSameOrigin(url) && req.mode === "navigate") {
    event.respondWith(networkFirstNavigation(req));
    return;
  }

  // 4. Everything else — passthrough (no cache).
});
