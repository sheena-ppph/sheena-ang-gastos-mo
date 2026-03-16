export default async function handler(req, res) {
  try {
    // Dynamic imports to avoid bundler issues
    const webpush = (await import('web-push')).default
    const { createClient } = await import('@supabase/supabase-js')

    const token = req.query.token || req.headers['x-push-token']
    if (token !== process.env.PUSH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const manilaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    const hour = manilaTime.getHours()
    if (hour < 8 || hour > 20) {
      return res.status(200).json({ message: 'Outside notification hours', hour })
    }

    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    )

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found' })
    }

    const messages = [
      '💸 Spent anything? Log it now!',
      '📝 Quick expense check-in!',
      '₱ Track your spending!',
      '🧾 Any purchases to log?',
    ]
    const body = messages[Math.floor(Math.random() * messages.length)]

    const payload = JSON.stringify({
      title: 'Ang Gastos Mo!',
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'anggastosmo-reminder',
      data: { action: 'quick-log' },
    })

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload)
          return { id: sub.id, status: 'sent' }
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            return { id: sub.id, status: 'removed (expired)' }
          }
          return { id: sub.id, status: 'failed', error: err.message }
        }
      })
    )

    return res.status(200).json({
      message: 'Push notifications sent',
      hour,
      results: results.map(r => r.value || r.reason),
    })
  } catch (err) {
    return res.status(500).json({
      error: 'Function crashed',
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    })
  }
}
