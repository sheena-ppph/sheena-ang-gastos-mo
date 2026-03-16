import { useState, useEffect } from 'react'
import { Receipt, BarChart3, Grid3X3, Settings as SettingsIcon } from 'lucide-react'
import ExpenseLog from './components/ExpenseLog'
import Summary from './components/Summary'
import Categories from './components/Categories'
import Settings from './components/Settings'
import QuickLogOverlay from './components/QuickLogOverlay'
import ReminderOverlay from './components/ReminderOverlay'
import { getCategories } from './lib/storage'

const TABS = [
  { id: 'log', label: 'Log', icon: Receipt },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'categories', label: 'Categories', icon: Grid3X3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('log')
  const [categories, setCategories] = useState([])
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getCategories().then(setCategories)

    // Listen for notification quick-log events (from SW click)
    const handleQuickLog = () => setShowQuickLog(true)
    window.addEventListener('anggastosmo-quicklog', handleQuickLog)

    // Listen for reminder events (from catch-up / scheduled check)
    const handleReminder = () => setShowReminder(true)
    window.addEventListener('anggastosmo-reminder', handleReminder)

    // Check URL param (when opened from notification)
    const params = new URLSearchParams(window.location.search)
    if (params.get('quicklog') === '1') {
      setShowQuickLog(true)
      window.history.replaceState({}, '', '/')
    }

    // Auto-update: when new service worker is available, activate it and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing
          if (newSW) {
            newSW.addEventListener('statechange', () => {
              if (newSW.state === 'activated') {
                window.location.reload()
              }
            })
          }
        })
      })
    }

    return () => {
      window.removeEventListener('anggastosmo-quicklog', handleQuickLog)
      window.removeEventListener('anggastosmo-reminder', handleReminder)
    }
  }, [])

  const refresh = () => setRefreshKey(k => k + 1)

  const onCategoriesChange = async () => {
    const cats = await getCategories()
    setCategories(cats)
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="pt-4 pb-2 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-800 text-ink tracking-tight">
              Sheena Ang Gastos Mo!
            </h1>
            <p className="section-label mt-0.5">Daily Expense Tracker</p>
          </div>
          <button
            onClick={() => setShowQuickLog(true)}
            className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-card hover:shadow-card-hover hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span className="text-2xl font-light leading-none">+</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4" key={`${activeTab}-${refreshKey}`}>
        {activeTab === 'log' && (
          <ExpenseLog categories={categories} onRefresh={refresh} />
        )}
        {activeTab === 'summary' && (
          <Summary categories={categories} />
        )}
        {activeTab === 'categories' && (
          <Categories categories={categories} onChange={onCategoriesChange} />
        )}
        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl border-t border-border">
        <div className="flex justify-around items-center py-2 px-2">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                  active
                    ? 'text-blue-600'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span className={`text-[10px] font-semibold ${active ? 'text-blue-600' : ''}`}>
                  {tab.label}
                </span>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Quick Log Overlay */}
      {showQuickLog && (
        <QuickLogOverlay
          categories={categories}
          onClose={() => setShowQuickLog(false)}
          onSaved={() => {
            setShowQuickLog(false)
            refresh()
          }}
        />
      )}

      {/* Reminder Overlay — alarm-style, must be manually dismissed */}
      {showReminder && (
        <ReminderOverlay
          onLogNow={() => {
            setShowReminder(false)
            setShowQuickLog(true)
          }}
          onDismiss={() => setShowReminder(false)}
        />
      )}
    </div>
  )
}
