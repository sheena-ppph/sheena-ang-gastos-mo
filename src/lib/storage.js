import { supabase } from './supabase'
import { getManilaDateStr } from './dateUtils'
import { DEFAULT_CATEGORIES } from './categories'

const LS_EXPENSES = 'anggastosmo_expenses'
const LS_CATEGORIES = 'anggastosmo_categories'
const LS_BUDGET = 'anggastosmo_budget'
const LS_NOTIF_PREFS = 'anggastosmo_notif_prefs'

function getLS(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch { return fallback }
}

function setLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ── Expenses ──

export async function getExpenses(dateStr) {
  if (supabase) {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('date', dateStr)
      .order('created_at', { ascending: false })
    return data || []
  }
  const all = getLS(LS_EXPENSES, [])
  return all.filter(e => e.date === dateStr).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )
}

export async function getExpensesRange(startDate, endDate) {
  if (supabase) {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: false })
    return data || []
  }
  const all = getLS(LS_EXPENSES, [])
  return all.filter(e => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function addExpense({ amount, category, note, date }) {
  const now = new Date()
  const expense = {
    id: crypto.randomUUID(),
    amount: Number(amount),
    category,
    note: note || null,
    date: date || getManilaDateStr(now),
    created_at: now.toISOString(),
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const all = getLS(LS_EXPENSES, [])
  all.push(expense)
  setLS(LS_EXPENSES, all)
  return expense
}

export async function deleteExpense(id) {
  if (supabase) {
    await supabase.from('expenses').delete().eq('id', id)
  } else {
    const all = getLS(LS_EXPENSES, [])
    setLS(LS_EXPENSES, all.filter(e => e.id !== id))
  }
}

// ── Categories ──

export async function getCategories() {
  if (supabase) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    return data?.length ? data : DEFAULT_CATEGORIES
  }
  const cats = getLS(LS_CATEGORIES, null)
  return cats || DEFAULT_CATEGORIES
}

export async function saveCategories(categories) {
  if (supabase) {
    for (const cat of categories) {
      await supabase.from('categories').upsert(cat)
    }
  } else {
    setLS(LS_CATEGORIES, categories)
  }
}

export async function addCategory({ name, emoji }) {
  const categories = await getCategories()
  const newCat = {
    id: crypto.randomUUID(),
    name,
    emoji,
    sort_order: categories.length,
    is_active: true,
  }

  if (supabase) {
    const { data } = await supabase
      .from('categories')
      .insert(newCat)
      .select()
      .single()
    return data
  }

  categories.push(newCat)
  setLS(LS_CATEGORIES, categories)
  return newCat
}

export async function deleteCategory(id) {
  if (supabase) {
    await supabase.from('categories').update({ is_active: false }).eq('id', id)
  } else {
    const cats = getLS(LS_CATEGORIES, DEFAULT_CATEGORIES)
    setLS(LS_CATEGORIES, cats.filter(c => c.id !== id))
  }
}

// ── Budget ──

export function getBudget() {
  return getLS(LS_BUDGET, { daily_limit: null, weekly_limit: null, monthly_limit: null })
}

export function saveBudget(budget) {
  setLS(LS_BUDGET, budget)
}

// ── Notification Prefs ──

export function getNotifPrefs() {
  return getLS(LS_NOTIF_PREFS, {
    enabled: true,
    start_hour: 8,
    end_hour: 20,
    interval_hours: 2,
  })
}

export function saveNotifPrefs(prefs) {
  setLS(LS_NOTIF_PREFS, prefs)
}
