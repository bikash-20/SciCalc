/* SciCalc service worker — offline-first app shell */
const VERSION = 'scicalc-v2.0.1'
const CORE_CACHE = `${VERSION}-core`
const ASSET_CACHE = `${VERSION}-assets`
const FONT_CACHE = `${VERSION}-fonts`

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-512.png',
  '/apple-touch-icon.png',
]

/** Extract the hashed JS/CSS bundle URLs referenced by index.html. */
async function entryAssetUrls() {
  const res = await fetch('/index.html')
  if (!res.ok) return []
  const html = await res.text()
  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
    .map((m) => m[1])
  return [...new Set(urls)]
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const coreCache = await caches.open(CORE_CACHE)
      await Promise.allSettled(CORE_ASSETS.map((url) => coreCache.add(url)))

      // Precache the hashed build bundle so the app is fully usable
      // offline even on the very first visit (not just after one live load).
      try {
        const urls = await entryAssetUrls()
        if (urls.length) {
          const assetCache = await caches.open(ASSET_CACHE)
          await Promise.allSettled(urls.map((url) => assetCache.add(url)))
        }
      } catch {
        /* first-ever install may still be cold; fetch-time cache-first covers it */
      }
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

const cacheFirst = async (request, cacheName) => {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

const staleWhileRevalidate = async (request, cacheName) => {
  const cached = await caches.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()))
      }
      return response
    })
    .catch(() => cached)
  return cached || network
}

const networkFirstPage = async (request) => {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CORE_CACHE)
      cache.put('/index.html', response.clone())
    }
    return response
  } catch {
    return (await caches.match('/index.html')) ||
           (await caches.match(request)) ||
           Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // cross-origin: Google Fonts only
  if (url.origin !== self.location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
      event.respondWith(staleWhileRevalidate(request, FONT_CACHE))
    }
    return
  }

  // navigations: network-first with offline fallback to shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }

  // hashed build assets: cache-first (immutable)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  // other same-origin static files: SWR
  if (/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname) ||
      url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
  }
})
