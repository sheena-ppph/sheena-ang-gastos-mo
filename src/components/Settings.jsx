import { useState, useEffect } from 'react'
import { Bell, BellOff, Target, Download, Info } from 'lucide-react'
import { getBudget, saveBudget, getNotifPrefs, saveNotifPrefs, getExpensesRange } from '../lib/storage'
import { getManilaDateStr, getMonthRange } from '../lib/dateUtils'
import { formatPeso } from '../lib/formatCurrency'
import { registerNotifications, unregisterNotifications } from '../lib/notifications'

export default function Settings() {
  const [notifPrefs, setNotifPrefs] = useState(getNotifPrefs())
  const [budget, setBudget] = useState(getBudget())
  const [editingBudget, setEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState({ daily: '', weekly: '', monthly: '' })

  const toggleNotifications = async () => {
    const newPrefs = { ...notifPrefs, enabled: !notifPrefs.enabled }
    if (newPrefs.enabled) {
      const granted = await registerNotifications(newPrefs)
      if (!granted) return
    } else {
      unregisterNotifications()
    }
    setNotifPrefs(newPrefs)
    saveNotifPrefs(newPrefs)
  }

  const saveBudgetGoals = () => {
    const newBudget = {
      daily_limit: tempBudget.daily ? Number(tempBudget.daily) : null,
      weekly_limit: tempBudget.weekly ? Number(tempBudget.weekly) : null,
      monthly_limit: tempBudget.monthly ? Number(tempBudget.monthly) : null,
    }
    setBudget(newBudget)
    saveBudget(newBudget)
    setEditingBudget(false)
  }

  const startEditBudget = () => {
    setTempBudget({
      daily: budget.daily_limit || '',
      weekly: budget.weekly_limit || '',
      monthly: budget.monthly_limit || '',
    })
    setEditingBudget(true)
  }

  const exportCSV = async () => {
    const today = getManilaDateStr()
    const { start, end } = getMonthRange(today)
    const expenses = await getExpensesRange(start, end)

    if (expenses.length === 0) {
      alert('No expenses to export this month')
      return
    }

    const header = 'Date,Category,Amount,Note\n'
    const rows = expenses.map(e =>
      `${e.date},"${e.category}",${e.amount},"${e.note || ''}"`
    ).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gastotrack-${start}-to-${end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scheduleDisplay = () => {
    const times = []
    for (let h = notifPrefs.start_hour; h <= notifPrefs.end_hour; h += notifPrefs.interval_hours) {
      const ampm = h >= 12 ? 'PM' : 'AM'
      const hr = h > 12 ? h - 12 : h === 0 ? 12 : h
      times.push(`${hr} ${ampm}`)
    }
    return times.join(', ')
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Notifications */}
      <div className="animate-fade-in-up">
        <p className="section-label mb-3">Notifications</p>
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {notifPrefs.enabled ? (
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bell size={20} className="text-blue-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                  <BellOff size={20} className="text-ink-faint" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-ink">Expense Reminders</p>
                <p className="text-xs text-ink-muted">
                  {notifPrefs.enabled ? 'Active' : 'Paused'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleNotifications}
              className={`w-12 h-7 rounded-full transition-all relative ${
                notifPrefs.enabled ? 'bg-blue-600' : 'bg-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                  notifPrefs.enabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {notifPrefs.enabled && (
            <div className="px-4 pb-4 pt-0">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  Quick-Log Popup Schedule
                </p>
                <p className="text-xs text-blue-800">
                  Every {notifPrefs.interval_hours} hours: {scheduleDisplay()}
                </p>
                <p className="text-[10px] text-blue-600 mt-2">
                  Reminders work best when the app is open. If you miss one, you'll be reminded when you next open the app.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Goals */}
      <div className="animate-fade-in-up delay-1">
        <p className="section-label mb-3">Budget Goals</p>
        <div className="bg-card rounded-2xl shadow-card p-4">
          {editingBudget ? (
            <div className="space-y-3">
              {[
                { label: 'Daily Limit', key: 'daily' },
                { label: 'Weekly Limit', key: 'weekly' },
                { label: 'Monthly Limit', key: 'monthly' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">{label}</p>
                  <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2">
                    <span className="text-ink-muted font-semibold">₱</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={tempBudget[key]}
                      onChange={e => setTempBudget({ ...tempBudget, [key]: e.target.value })}
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingBudget(false)}
                  className="flex-1 py-2 text-sm text-ink-muted font-medium rounded-xl bg-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBudgetGoals}
                  className="flex-1 py-2 text-sm text-white font-semibold rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-2 mb-3">
                {[
                  { label: 'Daily', value: budget.daily_limit },
                  { label: 'Weekly', value: budget.weekly_limit },
                  { label: 'Monthly', value: budget.monthly_limit },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-ink-muted">{label}</span>
                    <span className="font-mono text-sm font-600 text-ink">
                      {value ? formatPeso(value) : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={startEditBudget}
                className="w-full py-2 text-sm text-blue-600 font-semibold rounded-xl bg-blue-50 hover:bg-blue-100"
              >
                <Target size={14} className="inline mr-1" />
                Edit Budget Goals
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="animate-fade-in-up delay-2">
        <p className="section-label mb-3">Data</p>
        <button
          onClick={exportCSV}
          className="w-full bg-card rounded-2xl shadow-card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
            <Download size={20} className="text-success" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">Export to CSV</p>
            <p className="text-xs text-ink-muted">Download this month's expenses</p>
          </div>
        </button>
      </div>

      {/* About */}
      <div className="animate-fade-in-up delay-3">
        <div className="text-center py-4">
          <p className="font-display text-lg font-700 text-blue-600">Sheena Ang Gastos Mo!</p>
          <p className="text-[10px] text-ink-faint mt-0.5">v1.0.0 — Made with care</p>
        </div>
      </div>
    </div>
  )
}
