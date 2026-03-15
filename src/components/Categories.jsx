import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { addCategory, deleteCategory } from '../lib/storage'
import { DEFAULT_CATEGORIES } from '../lib/categories'

const EMOJI_PICKS = ['🍔', '☕', '🚗', '🏥', '🎮', '📚', '🎁', '💰', '🐾', '✈️', '🍺', '🧴', '⛽', '🏋️', '🎵', '💻', '🛠️', '🧹', '💄', '🎂']

export default function Categories({ categories, onChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📌')
  const [error, setError] = useState('')

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Enter a name')
      return
    }
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Category already exists')
      return
    }

    await addCategory({ name: trimmed, emoji: newEmoji })
    setNewName('')
    setNewEmoji('📌')
    setShowAdd(false)
    setError('')
    onChange()
  }

  const handleDelete = async (id) => {
    const isDefault = DEFAULT_CATEGORIES.some(c => c.id === id)
    if (isDefault) return
    await deleteCategory(id)
    onChange()
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center justify-between animate-fade-in-up">
        <p className="section-label">Your Categories</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} />
          Add New
        </button>
      </div>

      {/* Add Category Form */}
      {showAdd && (
        <div className="bg-card rounded-2xl p-4 shadow-card animate-fade-in-up space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">New Category</p>
            <button onClick={() => setShowAdd(false)}>
              <X size={16} className="text-ink-muted" />
            </button>
          </div>

          {/* Emoji Picker */}
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PICKS.map(e => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    newEmoji === e
                      ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                      : 'bg-surface hover:bg-blue-50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <input
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError('') }}
            className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-blue-200"
          />

          {error && <p className="text-danger text-xs font-semibold">{error}</p>}

          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Add {newEmoji} {newName || 'Category'}
          </button>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-2 animate-fade-in-up delay-1">
        {categories.map((cat, i) => {
          const isDefault = DEFAULT_CATEGORIES.some(c => c.id === cat.id)
          return (
            <div
              key={cat.id}
              className="bg-card rounded-xl p-3 shadow-card flex items-center gap-2.5 group animate-fade-in-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-xl">{cat.emoji}</span>
              </div>
              <p className="text-sm font-medium text-ink flex-1 truncate">{cat.name}</p>
              {!isDefault && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-danger-light transition-all"
                >
                  <Trash2 size={12} className="text-danger" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
