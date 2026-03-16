const NOTIF_MESSAGES = [
  '💸 Spent anything? Log it now!',
  '📝 Quick expense check-in!',
  '₱ Track your spending!',
  '🧾 Any purchases to log?',
]

let notifInterval = null
let visibilityHandler = null

function getRandomMessage() {
  return NOTIF_MESSAGES[Math.floor(Math.random() * NOTIF_MESSAGES.length)]
}

function getManilaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
}

function getLastNotifTime() {
  const t = localStorage.getItem('anggastosmo_last_notif_time')
  return t ? new Date(t) : null
}

function setLastNotifTime() {
  localStorage.setItem('anggastosmo_last_notif_time', new Date().toISOString())
}

// Find the most recent scheduled slot at or before the current hour
function getLastScheduledSlot(prefs) {
  const now = getManilaTime()
  const hour = now.getHours()

  if (hour < prefs.start_hour || hour > prefs.end_hour) return null

  const slotsSinceStart = Math.floor((hour - prefs.start_hour) / prefs.interval_hours)
  const slotHour = prefs.start_hour + (slotsSinceStart * prefs.interval_hours)

  const slot = new Date(now)
  slot.setHours(slotHour, 0, 0, 0)
  return slot
}

// Check if a notification was missed and show one immediately
function checkMissedNotification(prefs) {
  if (!prefs.enabled) return

  const lastSlot = getLastScheduledSlot(prefs)
  if (!lastSlot) return // outside active hours

  const lastShown = getLastNotifTime()

  // If never shown, or last shown was before this slot, show now
  if (!lastShown || lastShown < lastSlot) {
    showNotification()
  }
}

export async function registerNotifications(prefs) {
  if (!('Notification' in window)) {
    alert('Your browser does not support notifications')
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    alert('Please allow notifications to use the expense reminder')
    return false
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      // Send prefs to SW for best-effort background scheduling
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({ type: 'start-scheduler', prefs })
        }
      })
    } catch (e) {
      console.warn('Service worker registration failed:', e)
    }
  }

  startNotificationScheduler(prefs)
  return true
}

export function unregisterNotifications() {
  if (notifInterval) {
    clearInterval(notifInterval)
    notifInterval = null
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
}

function startNotificationScheduler(prefs) {
  unregisterNotifications()

  // Check every minute if it's time to send a notification
  const checkAndNotify = () => {
    const now = getManilaTime()
    const hour = now.getHours()
    const minute = now.getMinutes()

    // Fire within first 2 minutes of scheduled hour (avoids missing exact top-of-hour)
    if (
      minute < 2 &&
      hour >= prefs.start_hour &&
      hour <= prefs.end_hour &&
      (hour - prefs.start_hour) % prefs.interval_hours === 0
    ) {
      const lastShown = getLastNotifTime()
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)

      // Don't double-fire within 2 minutes
      if (!lastShown || lastShown < twoMinutesAgo) {
        showNotification()
      }
    }
  }

  // Check every 60 seconds
  notifInterval = setInterval(checkAndNotify, 60 * 1000)

  // Check right now for missed notifications
  checkMissedNotification(prefs)

  // Also check when app becomes visible again (user returns to app)
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      checkMissedNotification(prefs)
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

function showNotification() {
  if (Notification.permission !== 'granted') return

  setLastNotifTime()

  const notif = new Notification('Ang Gastos Mo!', {
    body: getRandomMessage(),
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'anggastosmo-reminder',
    renotify: true,
    data: { action: 'quick-log' },
  })

  notif.onclick = () => {
    window.focus()
    window.dispatchEvent(new CustomEvent('anggastosmo-quicklog'))
    notif.close()
  }
}

// Listen for service worker messages (when app is in background)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.action === 'quick-log') {
      window.dispatchEvent(new CustomEvent('anggastosmo-quicklog'))
    }
  })
}
