const CACHE_NAME = 'anggastosmo-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
]

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch (network first, cache fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
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
      // Focus existing window
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.postMessage({ action: 'quick-log' })
          return
        }
      }
      // Open new window
      return self.clients.openWindow('/?quicklog=1')
    })
  )
})
