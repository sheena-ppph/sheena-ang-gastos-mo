const CACHE_NAME = 'anggastosmo-v3'

// Notification config (defaults, updated via postMessage from main thread)
let notifPrefs = { enabled: true, start_hour: 8, end_hour: 20, interval_hours: 2 }
let schedulerTimeout = null

const NOTIF_MESSAGES = [
  '💸 Spent anything? Log it now!',
  '📝 Quick expense check-in!',
  '₱ Track your spending!',
  '🧾 Any purchases to log?',
]

// Install — skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate — clear old caches, take control, start scheduler
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => {
      self.clients.claim()
      scheduleNextNotification()
    })
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

// Message handler — receive prefs from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'start-scheduler') {
    notifPrefs = event.data.prefs || notifPrefs
    scheduleNextNotification()
  }
})

// Best-effort background notification scheduling
function getManilaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
}

function scheduleNextNotification() {
  if (schedulerTimeout) clearTimeout(schedulerTimeout)

  const now = getManilaTime()
  const hour = now.getHours()
  const minute = now.getMinutes()

  // Find next scheduled slot
  let nextHour = null
  for (let h = notifPrefs.start_hour; h <= notifPrefs.end_hour; h += notifPrefs.interval_hours) {
    if (h > hour || (h === hour && minute < 1)) {
      nextHour = h
      break
    }
  }

  // If no slot left today, schedule for first slot tomorrow
  if (nextHour === null) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(notifPrefs.start_hour, 0, 0, 0)
    const msUntil = tomorrow.getTime() - now.getTime()
    schedulerTimeout = setTimeout(fireAndReschedule, msUntil)
    return
  }

  const target = new Date(now)
  target.setHours(nextHour, 0, 0, 0)
  const msUntil = Math.max(target.getTime() - now.getTime(), 1000)

  schedulerTimeout = setTimeout(fireAndReschedule, msUntil)
}

function fireAndReschedule() {
  const msg = NOTIF_MESSAGES[Math.floor(Math.random() * NOTIF_MESSAGES.length)]

  self.registration.showNotification('Ang Gastos Mo!', {
    body: msg,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'anggastosmo-reminder',
    renotify: true,
    data: { action: 'quick-log' },
  })

  // Reschedule for next slot
  scheduleNextNotification()
}

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
