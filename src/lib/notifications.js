const NOTIF_MESSAGES = [
  '💸 Spent anything? Log it now!',
  '📝 Quick expense check-in!',
  '₱ Track your spending!',
  '🧾 Any purchases to log?',
]

let notifInterval = null

function getRandomMessage() {
  return NOTIF_MESSAGES[Math.floor(Math.random() * NOTIF_MESSAGES.length)]
}

function getManilaHour() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    hour12: false,
  })
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

  // Register service worker for background notifications
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
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
}

function startNotificationScheduler(prefs) {
  unregisterNotifications()

  // Check every minute if it's time to send a notification
  const checkAndNotify = () => {
    const now = new Date()
    const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    const hour = manilaTime.getHours()
    const minute = manilaTime.getMinutes()

    // Only fire at the top of scheduled hours
    if (
      minute === 0 &&
      hour >= prefs.start_hour &&
      hour <= prefs.end_hour &&
      (hour - prefs.start_hour) % prefs.interval_hours === 0
    ) {
      showNotification()
    }
  }

  // Check every 60 seconds
  notifInterval = setInterval(checkAndNotify, 60 * 1000)

  // Also check right now
  checkAndNotify()
}

function showNotification() {
  if (Notification.permission === 'granted') {
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
      // The app listens for this event to show the quick-log overlay
      window.dispatchEvent(new CustomEvent('anggastosmo-quicklog'))
      notif.close()
    }
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
