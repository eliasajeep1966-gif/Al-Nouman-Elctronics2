-- Supabase Database Schema for إلكترونيات النعمان
-- Run these SQL commands in your Supabase SQL Editor

DROP POLICY IF EXISTS "Allow public access to products" ON products;
DROP POLICY IF EXISTS "Allow public access to logs" ON logs;
DROP POLICY IF EXISTS "Allow public access to losses" ON losses;
DROP POLICY IF EXISTS "Allow public access to settings" ON settings;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE losses ADD COLUMN IF NOT EXISTS category TEXT;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER NOT NULL DEFAULT 0,
  selling_price INTEGER NOT NULL DEFAULT 0,
  original_price_usd REAL DEFAULT 0,
  selling_price_usd REAL DEFAULT 0,
  category TEXT NOT NULL,
  specifications TEXT,
  user_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  product_name TEXT NOT NULL,
  action TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  original_price INTEGER DEFAULT 0,
  selling_price INTEGER DEFAULT 0,
  original_price_usd REAL DEFAULT 0,
  selling_price_usd REAL DEFAULT 0,
  profit INTEGER DEFAULT 0,
  profit_usd REAL DEFAULT 0,
  loss_amount INTEGER DEFAULT 0,
  loss_amount_usd REAL DEFAULT 0,
  category TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS losses (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  amount_usd REAL DEFAULT 0,
  category TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  month TEXT NOT NULL,
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  exchange_rate INTEGER NOT NULL DEFAULT 14000,
  is_dark_mode INTEGER DEFAULT 0
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to logs" ON logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to losses" ON losses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO settings (id, exchange_rate, is_dark_mode) VALUES ('app_settings', 14000, 0) ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
