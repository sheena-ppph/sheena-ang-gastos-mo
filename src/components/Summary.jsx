import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getExpenses, getExpensesRange, getBudget } from '../lib/storage'
import { getManilaDateStr, getWeekRange, getMonthRange, getMonthName, formatDate } from '../lib/dateUtils'
import { formatPeso } from '../lib/formatCurrency'
import { DEFAULT_CATEGORIES } from '../lib/categories'

const VIEWS = ['Day', 'Week', 'Month']

function getCategoryEmoji(name) {
  return DEFAULT_CATEGORIES.find(c => c.name === name)?.emoji || '📌'
}

export default function Summary() {
  const [view, setView] = useState('Day')
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getManilaDateStr()
  const budget = getBudget()

  useEffect(() => {
    setLoading(true)
    let promise
    if (view === 'Day') {
      promise = getExpenses(today)
    } else if (view === 'Week') {
      const { start, end } = getWeekRange(today)
      promise = getExpensesRange(start, end)
    } else {
      const { start, end } = getMonthRange(today)
      promise = getExpensesRange(start, end)
    }
    promise.then(data => {
      setExpenses(data)
      setLoading(false)
    })
  }, [view])

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Category breakdown
  const byCategory = {}
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
  })
  const sorted = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
  const maxAmount = sorted.length > 0 ? sorted[0][1] : 0

  // Budget comparison
  const budgetLimit = view === 'Day' ? budget.daily_limit
    : view === 'Week' ? budget.weekly_limit
    : budget.monthly_limit
  const budgetPercent = budgetLimit ? Math.min((total / budgetLimit) * 100, 100) : null

  // Daily breakdown for week/month view
  const byDate = {}
  expenses.forEach(e => {
    byDate[e.date] = (byDate[e.date] || 0) + Number(e.amount)
  })
  const dailyEntries = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a))

  const periodLabel = view === 'Day' ? 'Today'
    : view === 'Week' ? 'This Week'
    : getMonthName(today)

  return (
    <div className="pt-4 space-y-4">
      {/* View Toggle */}
      <div className="flex bg-card rounded-xl p-1 shadow-card animate-fade-in-up">
        {VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              view === v
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Total Card */}
      <div className="animate-fade-in-up delay-1">
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <p className="section-label mb-1">{periodLabel}</p>
          <p className="font-display text-3xl font-800 text-ink tracking-tight">
            {formatPeso(total)}
          </p>

          {budgetLimit && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-muted">Budget</span>
                <span className={`font-semibold ${budgetPercent >= 90 ? 'text-danger' : budgetPercent >= 70 ? 'text-warning' : 'text-success'}`}>
                  {budgetPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercent >= 90 ? 'bg-danger' : budgetPercent >= 70 ? 'bg-warning' : 'bg-blue-500'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-faint mt-1">
                {formatPeso(budgetLimit - total)} remaining of {formatPeso(budgetLimit)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8 animate-fade-in-up delay-2">
          <p className="text-ink-muted text-sm">No expenses for this period</p>
        </div>
      ) : (
        <div className="animate-fade-in-up delay-2">
          <p className="section-label mb-3">By Category</p>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {sorted.map(([cat, amt], i) => (
              <div
                key={cat}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < sorted.length - 1 ? 'border-b border-border-light' : ''
                }`}
              >
                <span className="text-lg">{getCategoryEmoji(cat)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-ink truncate">{cat}</span>
                    <span className="font-mono text-xs font-600 text-ink shrink-0 ml-2">
                      {formatPeso(amt)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(amt / maxAmount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily breakdown for week/month */}
      {view !== 'Day' && dailyEntries.length > 0 && (
        <div className="animate-fade-in-up delay-3">
          <p className="section-label mb-3">Daily Breakdown</p>
          <div className="space-y-2">
            {dailyEntries.map(([date, amt]) => (
              <div
                key={date}
                className="bg-card rounded-xl px-4 py-3 shadow-card flex items-center justify-between"
              >
                <span className="text-sm text-ink-muted">{formatDate(date)}</span>
                <span className="font-mono text-sm font-600 text-ink">{formatPeso(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
