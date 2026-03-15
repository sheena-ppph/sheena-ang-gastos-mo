export const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Drinks', emoji: '🍜', sort_order: 0, type: 'need' },
  { id: 'transport', name: 'Transport', emoji: '🛵', sort_order: 1, type: 'need' },
  { id: 'groceries', name: 'Groceries', emoji: '🛒', sort_order: 2, type: 'need' },
  { id: 'bills', name: 'Bills & Utilities', emoji: '💡', sort_order: 3, type: 'need' },
  { id: 'load', name: 'Load & Data', emoji: '📱', sort_order: 4, type: 'need' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', sort_order: 5, type: 'want' },
  { id: 'health', name: 'Health', emoji: '💊', sort_order: 6, type: 'need' },
  { id: 'home', name: 'Home', emoji: '🏠', sort_order: 7, type: 'need' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', sort_order: 8, type: 'want' },
  { id: 'others', name: 'Others', emoji: '📌', sort_order: 9, type: 'want' },
]

export function getCategoryType(categoryName) {
  const cat = DEFAULT_CATEGORIES.find(c => c.name === categoryName)
  return cat?.type || 'want'
}

export function getCategoryEmoji(categoryName) {
  const cat = DEFAULT_CATEGORIES.find(c => c.name === categoryName)
  return cat?.emoji || '📌'
}
