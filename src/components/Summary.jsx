import { useState, useEffect } from 'react'
import { Trash2, Pencil, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { getExpenses, getExpensesRange, deleteExpense, addExpense } from '../lib/storage'
import { getManilaDateStr, getWeekRange, getMonthRange, getMonthName, formatDate, formatTime } from '../lib/dateUtils'
import { formatPeso } from '../lib/formatCurrency'
import { DEFAULT_CATEGORIES } from '../lib/categories'

const VIEWS = ['Day', 'Week', 'Month']

function getCategoryEmoji(name) {
  return DEFAULT_CATEGORIES.find(c => c.name === name)?.emoji || '📌'
}

export default function Summary({ categories }) {
  const [view, setView] = useState('Month')
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editNote, setEditNote] = useState('')
  const [expandedDate, setExpandedDate] = useState(null)
  const today = getManilaDateStr()

  const loadExpenses = () => {
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
  }

  useEffect(() => {
    loadExpenses()
    setExpandedDate(null)
    setEditingId(null)
  }, [view])

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Group by date
  const byDate = {}
  expenses.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = []
    byDate[e.date].push(e)
  })
  const dateEntries = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a))

  const handleDelete = async (id) => {
    await deleteExpense(id)
    loadExpenses()
  }

  const startEdit = (expense) => {
    setEditingId(expense.id)
    setEditAmount(String(expense.amount))
    setEditCategory(expense.category)
    setEditNote(expense.note || '')
  }

  const saveEdit = async (expense) => {
    // Delete old and create new with updated values
    await deleteExpense(expense.id)
    await addExpense({
      amount: Number(editAmount),
      category: editCategory,
      note: editNote.trim() || null,
      date: expense.date,
    })
    setEditingId(null)
    loadExpenses()
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const toggleDate = (date) => {
    setExpandedDate(expandedDate === date ? null : date)
    setEditingId(null)
  }

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

      {/* Total */}
      <div className="animate-fade-in-up delay-1">
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="section-label">{periodLabel}</p>
            <p className="font-display text-2xl font-800 text-ink tracking-tight mt-0.5">
              {formatPeso(total)}
            </p>
          </div>
          <p className="text-xs text-ink-muted">
            {expenses.length} item{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Expense List by Date */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : dateEntries.length === 0 ? (
        <div className="text-center py-8 animate-fade-in-up delay-2">
          <p className="text-ink-muted text-sm">No expenses for this period</p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in-up delay-2">
          {dateEntries.map(([date, items]) => {
            const dateTotal = items.reduce((s, e) => s + Number(e.amount), 0)
            const isExpanded = expandedDate === date || view === 'Day'

            return (
              <div key={date} className="bg-card rounded-2xl shadow-card overflow-hidden">
                {/* Date Header */}
                <button
                  onClick={() => view !== 'Day' && toggleDate(date)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${
                    view !== 'Day' ? 'active:bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {date === today ? 'Today' : formatDate(date)}
                    </span>
                    <span className="text-[10px] text-ink-faint bg-surface px-1.5 py-0.5 rounded-md">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-600 text-ink">
                      {formatPeso(dateTotal)}
                    </span>
                    {view !== 'Day' && (
                      isExpanded
                        ? <ChevronUp size={14} className="text-ink-faint" />
                        : <ChevronDown size={14} className="text-ink-faint" />
                    )}
                  </div>
                </button>

                {/* Expense Items */}
                {isExpanded && (
                  <div className="border-t border-border-light">
                    {items.map(expense => (
                      <div key={expense.id} className="border-b border-border-light last:border-b-0">
                        {editingId === expense.id ? (
                          /* Edit Mode */
                          <div className="px-4 py-3 space-y-2 bg-blue-50/50">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-lg font-700 text-blue-600">₱</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                className="flex-1 bg-white rounded-lg px-3 py-1.5 text-sm font-semibold outline-none ring-1 ring-blue-200 focus:ring-blue-400"
                              />
                            </div>
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              className="w-full bg-white rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-blue-200 focus:ring-blue-400"
                            >
                              {(categories || DEFAULT_CATEGORIES).map(cat => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.emoji} {cat.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              value={editNote}
                              onChange={e => setEditNote(e.target.value)}
                              className="w-full bg-white rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-blue-200 focus:ring-blue-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={cancelEdit}
                                className="flex-1 py-1.5 text-xs font-medium text-ink-muted bg-white rounded-lg ring-1 ring-border"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEdit(expense)}
                                className="flex-1 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg flex items-center justify-center gap-1"
                              >
                                <Check size={12} />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex items-center gap-3 px-4 py-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <span className="text-base">{getCategoryEmoji(expense.category)}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink truncate">
                                {expense.category}
                              </p>
                              {expense.note && (
                                <p className="text-[11px] text-ink-muted truncate">{expense.note}</p>
                              )}
                              <p className="text-[10px] text-ink-faint">
                                {formatTime(expense.created_at)}
                              </p>
                            </div>

                            <p className="font-mono text-sm font-600 text-ink shrink-0">
                              {formatPeso(expense.amount)}
                            </p>

                            <button
                              onClick={() => startEdit(expense)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all shrink-0"
                            >
                              <Pencil size={13} className="text-blue-500" />
                            </button>

                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1.5 rounded-lg hover:bg-danger-light active:bg-danger-light transition-all shrink-0"
                            >
                              <Trash2 size={13} className="text-danger" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
