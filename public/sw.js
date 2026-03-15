const CACHE_NAME = 'anggastosmo-v2'

// Install — skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate — clear old caches and take control
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

  // Always go to network for navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // For other assets: network first, cache fallback
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

// Push notification
self.addEventListener('push', (event) => {
  const messages = [
    '💸 Spent anything? Log it now!',
    '📝 Quick expense check-in!',
    '₱ Track your spending!',
    '🧾 Any purchases to log?',
  ]
  const body = messages[Math.floor(Math.random() * messages.length)]

  event.waitUntil(
    self.registration.showNotification('Ang Gastos Mo!', {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'anggastosmo-reminder',
      renotify: true,
      data: { action: 'quick-log' },
      actions: [
        { action: 'log', title: '📝 Log Expense' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  )
})

// Notification click → open app with quick-log overlay
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.postMessage({ action: 'quick-log' })
          return
        }
      }
      return self.clients.openWindow('/?quicklog=1')
    })
  )
})
