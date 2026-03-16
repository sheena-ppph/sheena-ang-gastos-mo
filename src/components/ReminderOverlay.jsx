import { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'

const MESSAGES = [
  'Spent anything?',
  'Any purchases to log?',
  'Track your spending!',
  'Quick expense check-in!',
]

export default function ReminderOverlay({ onLogNow, onDismiss }) {
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
  const audioRef = useRef(null)
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    // Play alarm sound on loop
    const audio = new Audio('/alarm.wav')
    audio.loop = true
    audio.volume = 0.8
    audioRef.current = audio

    // Try to play (may be blocked by browser autoplay policy)
    audio.play().catch(() => {
      // If autoplay blocked, play on first user interaction
      const playOnInteraction = () => {
        audio.play().catch(() => {})
        document.removeEventListener('touchstart', playOnInteraction)
        document.removeEventListener('click', playOnInteraction)
      }
      document.addEventListener('touchstart', playOnInteraction)
      document.addEventListener('click', playOnInteraction)
    })

    // Vibrate pattern (like alarm clock) — works on Android
    if ('vibrate' in navigator) {
      const vibrateLoop = setInterval(() => {
        navigator.vibrate([300, 200, 300, 200, 300])
      }, 2000)
      return () => {
        clearInterval(vibrateLoop)
        audio.pause()
        audio.currentTime = 0
        navigator.vibrate(0)
      }
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  // Pulse animation toggle
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000)
    return () => clearInterval(interval)
  }, [])

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if ('vibrate' in navigator) navigator.vibrate(0)
  }

  const handleLogNow = () => {
    stopAlarm()
    onLogNow()
  }

  const handleDismiss = () => {
    stopAlarm()
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop — no click to dismiss */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-[85%] max-w-[360px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

        <div className="p-6 text-center">
          {/* Pulsing bell icon */}
          <div className="mx-auto mb-4 relative">
            <div className={`w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto transition-transform duration-500 ${
              pulse ? 'scale-110' : 'scale-100'
            }`}>
              <Bell
                size={36}
                className={`text-blue-600 transition-transform duration-300 ${
                  pulse ? 'rotate-12' : '-rotate-12'
                }`}
              />
            </div>
            {/* Ripple rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full border-2 border-blue-300 animate-ping opacity-30" />
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display text-xl font-800 text-ink mb-1">
            Hey Sheena!
          </h2>
          <p className="text-ink-muted text-sm mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleLogNow}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold text-sm rounded-2xl shadow-card hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              Log Expense Now
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-ink-muted font-medium text-sm rounded-2xl hover:bg-surface active:scale-[0.98] transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
