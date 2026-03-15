-- Seed default categories
INSERT INTO categories (id, name, emoji, sort_order) VALUES
  (gen_random_uuid(), 'Food & Drinks', '🍜', 0),
  (gen_random_uuid(), 'Transport', '🛵', 1),
  (gen_random_uuid(), 'Groceries', '🛒', 2),
  (gen_random_uuid(), 'Bills & Utilities', '💡', 3),
  (gen_random_uuid(), 'Load & Data', '📱', 4),
  (gen_random_uuid(), 'Shopping', '🛍️', 5),
  (gen_random_uuid(), 'Health', '💊', 6),
  (gen_random_uuid(), 'Home', '🏠', 7),
  (gen_random_uuid(), 'Entertainment', '🎬', 8),
  (gen_random_uuid(), 'Others', '📌', 9)
ON CONFLICT (name) DO NOTHING;
