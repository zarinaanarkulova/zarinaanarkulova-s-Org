
import { createClient } from '@supabase/supabase-js';

// Muhit o'zgaruvchilarini olish funksiyasi
const getEnv = (key: string): string => {
  const env = (import.meta as any).env;
  return env && env[key] ? env[key] : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://utkeynqloxshfytjclvt.supabase.co';

// Foydalanuvchi tomonidan taqdim etilgan yangi Supabase Publishable Key
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_XiGjZA59fWnjQ3LO0Enoqg_wZtwSP_0';

export const supabase = createClient(supabaseUrl, supabaseKey);
