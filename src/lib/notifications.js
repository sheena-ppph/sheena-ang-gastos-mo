import { supabase } from './supabase'

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

// Check if a notification was missed — triggers in-app reminder
function checkMissedNotification(prefs) {
  if (!prefs.enabled) return

  const lastSlot = getLastScheduledSlot(prefs)
  if (!lastSlot) return

  const lastShown = getLastNotifTime()

  if (!lastShown || lastShown < lastSlot) {
    setLastNotifTime()
    // Dispatch event so App.jsx shows ReminderOverlay
    window.dispatchEvent(new CustomEvent('anggastosmo-reminder'))
  }
}

// Convert VAPID key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

// Subscribe to Web Push and save subscription to Supabase
async function subscribeToPush(registration) {
  try {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.warn('No VAPID public key configured')
      return
    }

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    // Save to Supabase (upsert by endpoint to avoid duplicates)
    if (supabase) {
      const subJson = subscription.toJSON()

      // Check if this subscription already exists
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('subscription->>endpoint', subJson.endpoint)

      if (!existing || existing.length === 0) {
        await supabase.from('push_subscriptions').insert({
          subscription: subJson,
        })
      }
    }

    console.log('Push subscription active')
  } catch (err) {
    console.warn('Push subscription failed:', err)
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

  // Register service worker and subscribe to push
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')

      // Subscribe to Web Push for real background notifications
      await subscribeToPush(reg)

      // Also send prefs to SW for best-effort local scheduling
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

  const checkAndNotify = () => {
    const now = getManilaTime()
    const hour = now.getHours()
    const minute = now.getMinutes()

    if (
      minute < 2 &&
      hour >= prefs.start_hour &&
      hour <= prefs.end_hour &&
      (hour - prefs.start_hour) % prefs.interval_hours === 0
    ) {
      const lastShown = getLastNotifTime()
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)

      if (!lastShown || lastShown < twoMinutesAgo) {
        setLastNotifTime()
        // Show in-app reminder instead of browser notification
        window.dispatchEvent(new CustomEvent('anggastosmo-reminder'))
      }
    }
  }

  notifInterval = setInterval(checkAndNotify, 60 * 1000)

  // Check for missed notifications on start
  checkMissedNotification(prefs)

  // Check when app becomes visible
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      checkMissedNotification(prefs)
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

// Listen for service worker messages (when notification is clicked)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.action === 'quick-log') {
      window.dispatchEvent(new CustomEvent('anggastosmo-quicklog'))
    }
  })
}
