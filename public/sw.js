// Bump to drop old caches on deploy.
const CACHE = 'tinytime-v3'
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/pwa-192.png']

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)
    // Firestore, Functions etc. must always hit the network.
    if (request.method !== 'GET' || url.origin !== self.location.origin) return

    // Network-first for pages so deploys show up immediately; cached shell when offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const copy = res.clone()
                    caches.open(CACHE).then((c) => c.put('/', copy))
                    return res
                })
                .catch(() => caches.match('/'))
        )
        return
    }

    // Vite assets are content-hashed, so cache-first is safe.
    event.respondWith(
        caches.match(request).then((hit) => hit || fetch(request).then((res) => {
            if (res.ok) {
                const copy = res.clone()
                caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
        }))
    )
})

// Sent as FCM data-only messages by the pushNotify Cloud Function.
self.addEventListener('push', (event) => {
    let payload = {}
    try { payload = event.data.json() } catch { /* not JSON, show defaults */ }
    const data = payload.data || payload
    event.waitUntil(
        self.registration.showNotification(data.title || 'TinyTime', {
            body: data.body,
            icon: '/pwa-192.png',
            tag: data.eventId,
            data: { url: data.url || '/' },
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            const open = windows.find((w) => w.url.startsWith(self.location.origin))
            return open ? open.navigate(url).then((w) => w.focus()) : self.clients.openWindow(url)
        })
    )
})
