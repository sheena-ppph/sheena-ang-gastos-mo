import { useState } from 'react'
import { X, Check, CalendarDays } from 'lucide-react'
import { addExpense } from '../lib/storage'
import { formatPeso } from '../lib/formatCurrency'
import { getManilaDateStr } from '../lib/dateUtils'

const MIN_DATE = '2026-03-01'
const MAX_YEAR_DATE = '2026-12-31'

export default function QuickLogOverlay({ categories, onClose, onSaved }) {
  const [amount, setAmount] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(getManilaDateStr())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = getManilaDateStr()
  const maxDate = today < MAX_YEAR_DATE ? today : MAX_YEAR_DATE
  const isToday = date === today

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Enter an amount')
      return
    }
    if (!selectedCat) {
      setError('Pick a category')
      return
    }
    if (date < MIN_DATE || date > maxDate) {
      setError('Date must be between March 1 and today (2026 only)')
      return
    }

    setSaving(true)
    try {
      await addExpense({
        amount: Number(amount),
        category: selectedCat.name,
        note: note.trim() || null,
        date,
      })
      onSaved()
    } catch {
      setError('Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl animate-slide-up">
        {/* Handle + Close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full bg-border" />
            <span className="section-label">Quick Log</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center"
          >
            <X size={16} className="text-ink-muted" />
          </button>
        </div>

        {/* Amount Input */}
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center gap-2 bg-blue-50 rounded-2xl px-4 py-3">
            <span className="font-display text-3xl font-700 text-blue-600">₱</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              autoFocus
              className="flex-1 bg-transparent text-3xl font-display font-700 text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="px-5 pb-3">
          <p className="section-label mb-2">Date</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface rounded-xl px-3 py-2">
              <CalendarDays size={16} className="text-blue-500 shrink-0" />
              <input
                type="date"
                value={date}
                min={MIN_DATE}
                max={maxDate}
                onChange={e => { setDate(e.target.value); setError('') }}
                className="flex-1 bg-transparent text-sm font-medium text-ink outline-none"
              />
            </div>
            {!isToday && (
              <button
                onClick={() => setDate(today)}
                className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
              >
                Today
              </button>
            )}
          </div>
          {!isToday && (
            <p className="text-[10px] text-warning font-medium mt-1">
              Logging for a past date
            </p>
          )}
        </div>

        {/* Category Grid */}
        <div className="px-5 pb-3">
          <p className="section-label mb-2">Category</p>
          <div className="grid grid-cols-5 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCat(cat); setError('') }}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                  selectedCat?.id === cat.id
                    ? 'bg-blue-100 ring-2 ring-blue-500 scale-105'
                    : 'bg-surface hover:bg-blue-50'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[9px] font-semibold text-ink-muted leading-tight text-center truncate w-full">
                  {cat.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="px-5 pb-4">
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="px-5 pb-2 text-danger text-xs font-semibold animate-shake">{error}</p>
        )}

        {/* Save Button */}
        <div className="px-5 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={18} />
            {saving ? 'Saving...' : amount ? `Save ${formatPeso(amount)}` : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
