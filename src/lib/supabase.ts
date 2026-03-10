import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qxaokgzqtzhrztqnzxcw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qTIEUPupuTwwSMpJTgvvcA_GWtga_KK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const TABLES = {
  PRODUCTS: 'products',
  LOGS: 'logs',
  LOSSES: 'losses',
  SETTINGS: 'settings',
} as const;
