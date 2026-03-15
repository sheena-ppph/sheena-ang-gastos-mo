import { useState, useEffect } from 'react'
import { Trash2, Coffee, ShoppingBag } from 'lucide-react'
import { getExpenses, deleteExpense } from '../lib/storage'
import { getManilaDateStr, formatTime } from '../lib/dateUtils'
import { formatPeso } from '../lib/formatCurrency'
import { DEFAULT_CATEGORIES } from '../lib/categories'

function getCategoryEmoji(categoryName) {
  const cat = DEFAULT_CATEGORIES.find(c => c.name === categoryName)
  return cat?.emoji || '📌'
}

export default function ExpenseLog({ categories, onRefresh }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getManilaDateStr()

  const loadExpenses = async () => {
    setLoading(true)
    const data = await getExpenses(today)
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleDelete = async (id) => {
    await deleteExpense(id)
    await loadExpenses()
    onRefresh()
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="pt-4 space-y-4">
      {/* Today's Total */}
      <div className="animate-fade-in-up">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-card">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Today's Spending
          </p>
          <p className="font-display text-4xl font-800 tracking-tight">
            {formatPeso(total)}
          </p>
          <p className="text-blue-200 text-sm mt-1">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} logged
          </p>
        </div>
      </div>

      {/* Expense List */}
      <div className="animate-fade-in-up delay-1">
        <p className="section-label mb-3">Today's Expenses</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Coffee size={28} className="text-blue-400" />
            </div>
            <p className="text-ink-muted text-sm font-medium">No expenses yet today</p>
            <p className="text-ink-faint text-xs mt-1">Tap + to log your first expense</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense, i) => (
              <div
                key={expense.id}
                className="bg-card rounded-xl p-3.5 shadow-card flex items-center gap-3 animate-fade-in-up group"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Category emoji */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">{getCategoryEmoji(expense.category)}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {expense.category}
                  </p>
                  {expense.note && (
                    <p className="text-xs text-ink-muted truncate">{expense.note}</p>
                  )}
                  <p className="text-[10px] text-ink-faint mt-0.5">
                    {formatTime(expense.created_at)}
                  </p>
                </div>

                {/* Amount */}
                <p className="font-mono text-sm font-600 text-ink shrink-0">
                  {formatPeso(expense.amount)}
                </p>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger-light transition-all shrink-0"
                >
                  <Trash2 size={14} className="text-danger" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
