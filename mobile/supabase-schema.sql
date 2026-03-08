-- Supabase Database Schema for إلكترونيات النعمان
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create products table
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
  created_at TEXT NOT NULL
);

-- 2. Create logs table (transaction history)
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
  timestamp TEXT NOT NULL
);

-- 3. Create losses table
CREATE TABLE IF NOT EXISTS losses (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  amount_usd REAL DEFAULT 0,
  category TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  month TEXT NOT NULL
);

-- 4. Create settings table (for exchange rate, etc.)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  exchange_rate INTEGER NOT NULL DEFAULT 14000,
  is_dark_mode INTEGER DEFAULT 0
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for public access (for mobile app)
-- These policies allow read/write without authentication
CREATE POLICY "Allow public access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to logs" ON logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to losses" ON losses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- 7. Insert default settings if not exists
INSERT INTO settings (id, exchange_rate, is_dark_mode) 
VALUES ('app_settings', 14000, 0)
ON CONFLICT (id) DO NOTHING;
