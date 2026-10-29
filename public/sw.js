/* Keepup Service Worker: Offline-Cache + Push-Erinnerungen */
const CACHE = 'keepup-v1'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icons/icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  // Seiten: zuerst Netzwerk (für Updates), sonst Cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))),
    )
    return
  }

  // Assets (gehasht): Cache zuerst
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(req, copy))
      }
      return res
    })),
  )
})

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Keepup'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    tag: data.tag,
    data: { url: data.url || './' },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus()
      return self.clients.openWindow(target)
    }),
  )
})
