/*
 * Studio AZ check-in kiosk — offline service worker.
 *
 * Why this exists: the kiosk runs as a home-screen web app in `standalone`
 * display mode, which has no address bar and no reload button. Without a
 * service worker every launch needed a live fetch from Vercel, so a dropped
 * shop WiFi connection left iOS painting the manifest's background colour and
 * nothing else — the "black screen". There was no way for it to recover on its
 * own, and no way for staff to reload it.
 *
 * With the shell cached the app always renders, and OfflineGuard can show a
 * real "reconnecting" state instead of a black void.
 *
 * Design rules, both learned the hard way while building this:
 *
 * 1. Never take over a page mid-flight. `clients.claim()` hands an already-
 *    loading page to a brand-new worker and its in-flight requests die — which
 *    showed up as fonts failing to load and the warm-up caching nothing. The
 *    new worker activates immediately but only controls the NEXT navigation.
 * 2. A handler must always resolve to a Response. Anything else (an undefined
 *    from a cache miss, a rejection) becomes a hard network error for that
 *    request, which is strictly worse than not intercepting at all.
 */

// Bump to invalidate every cache: `activate` deletes anything not on this
// version, which is the escape hatch if a bad entry ever gets stored.
const VERSION = 'v2';
const SHELL_CACHE = `kiosk-shell-${VERSION}`;
const ASSET_CACHE = `kiosk-assets-${VERSION}`;

// The bare minimum needed to paint the welcome screen.
const SHELL_URLS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// Cross-origin hosts worth keeping offline copies of. Barber/artist photos and
// webfonts are cosmetic, so they are never allowed to break a live request.
const CACHEABLE_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'assets.cdn.filesafe.space',
  'storage.googleapis.com',
  'msgsndr-private.storage.googleapis.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // `reload` bypasses the HTTP cache so we precache what the server has now,
      // not a stale copy. Individual failures must not abort the install.
      .then((cache) =>
        Promise.allSettled(
          SHELL_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key))
      )
    )
    // Deliberately no clients.claim() — see rule 1 above.
  );
});

/*
 * The page that registers a service worker isn't controlled by it yet, so its
 * asset requests never reach this worker and the cache would stay empty until
 * a second visit — no good for a kiosk that may get exactly one clean load
 * before the WiFi drops. OfflineGuard posts the URLs it actually loaded so we
 * can fetch and store them ourselves.
 */
self.addEventListener('message', (event) => {
  const { type, urls } = event.data || {};
  if (type !== 'WARM_CACHE' || !Array.isArray(urls)) return;
  event.waitUntil(warmCache(urls));
});

async function warmCache(urls) {
  const cache = await caches.open(ASSET_CACHE);
  const existing = new Set((await cache.keys()).map((request) => request.url));

  const wanted = urls.filter((url) => {
    if (existing.has(url)) return false;
    try {
      return isCacheableAsset(new URL(url));
    } catch {
      return false;
    }
  });

  await Promise.allSettled(
    wanted.map(async (url) => {
      const response = await fetchForCache(url);
      if (response) await cache.put(url, response);
    })
  );
}

/*
 * Cross-origin assets have to be fetched CORS-first. An opaque (no-cors)
 * response is fine for an <img>, but a stylesheet or webfont request rejects
 * one outright — caching the Google Fonts CSS as opaque silently dropped the
 * kiosk to system sans-serif. Only fall back to no-cors for hosts that genuinely
 * don't send CORS headers, such as the photo CDNs.
 */
async function fetchForCache(url) {
  if (new URL(url).origin === self.location.origin) {
    try {
      const response = await fetch(url);
      return response.ok ? response : null;
    } catch {
      return null;
    }
  }

  try {
    const cors = await fetch(new Request(url, { mode: 'cors' }));
    if (cors.ok) return cors;
  } catch {
    // Host doesn't allow CORS — fall through to an opaque copy.
  }

  try {
    const opaque = await fetch(new Request(url, { mode: 'no-cors' }));
    return opaque.type === 'opaque' || opaque.ok ? opaque : null;
  } catch {
    return null;
  }
}

function isCacheableAsset(url) {
  if (url.origin === self.location.origin) {
    return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon-');
  }
  return CACHEABLE_HOSTS.includes(url.hostname);
}

function isUsable(response, request) {
  // An opaque entry can't satisfy a CORS-mode request (stylesheets and webfonts
  // among them) — handing one over fails the request outright.
  return Boolean(response) && !(response.type === 'opaque' && request.mode === 'cors');
}

function storeInBackground(cacheName, request, response) {
  if (!response.ok && response.type !== 'opaque') return;
  const copy = response.clone();
  caches
    .open(cacheName)
    .then((cache) => cache.put(request, copy))
    .catch(() => {});
}

// Same-origin build output is content-hashed, so a cache hit is always correct
// and saves the round-trip that flaky WiFi turns into a hang.
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (isUsable(cached, request)) return cached;
  } catch {
    // Fall through to the network.
  }

  const response = await fetch(request);
  storeInBackground(ASSET_CACHE, request, response);
  return response;
}

// Cosmetic cross-origin assets. Network wins whenever there is one, so a bad
// cached entry can never poison a working kiosk; the cache is purely a fallback.
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    storeInBackground(cacheName, request, response);
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (isUsable(cached, request)) return cached;
    throw err;
  }
}

// The whole point of the worker: serve the shell from cache when the network
// is gone, so the kiosk shows its UI instead of a black screen.
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    storeInBackground(SHELL_CACHE, '/', response);
    return response;
  } catch (err) {
    const cached = (await caches.match('/')) || (await caches.match(request));
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never cache backend calls — appointment data must always be live, and a
  // stale check-in list would be worse than no list at all.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (!isCacheableAsset(url)) return;

  const sameOrigin = url.origin === self.location.origin;
  event.respondWith(
    sameOrigin ? cacheFirst(request) : networkFirst(request, ASSET_CACHE)
  );
});
