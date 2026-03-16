const CACHE_NAME = 'anggastosmo-v4'

// Install — skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate — clear old caches, take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch — network first, cache fallback (skip caching HTML navigations)
self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Real push notification from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Ang Gastos Mo!',
    body: '💸 Spent anything? Log it now!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      tag: 'anggastosmo-reminder',
      renotify: true,
      requireInteraction: true, // Stays until manually dismissed
      vibrate: [300, 200, 300, 200, 300, 200, 300], // Alarm pattern
      data: { action: 'quick-log' },
      actions: [
        { action: 'log', title: '📝 Log Now' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  )
})

// Notification click → open app with reminder overlay
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action // 'log', 'dismiss', or '' (body click)

  if (action === 'dismiss') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Try to focus existing window
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.postMessage({ action: 'quick-log' })
          return
        }
      }
      // No existing window — open new one
      return self.clients.openWindow('/?quicklog=1')
    })
  )
})

// Message handler — receive prefs from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'start-scheduler') {
    // Acknowledged — real push comes from server now
    console.log('Push scheduler: server-side via cron-job.org')
  }
})
