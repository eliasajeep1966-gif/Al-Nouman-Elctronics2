import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
export const TABLES = {
  PRODUCTS: 'products',
  LOGS: 'logs',
  LOSSES: 'losses',
  SETTINGS: 'settings',
} as const;
