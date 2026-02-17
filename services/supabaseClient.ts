import { createClient } from '@supabase/supabase-js';

/**
 * Muhit o'zgaruvchilariga xavfsiz kirish.
 * Vite build paytida import.meta.env ni almashtiradi.
 * Biz qo'shimcha ravishda process.env ni ham tekshiramiz (vite.config.ts orqali yuborilgan).
 */
const getEnv = (key: string, defaultValue: string): string => {
  // 1. Vite standart import.meta.env ni tekshiramiz
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) {
    return metaEnv[key];
  }

  // 2. process.env ni tekshiramiz (vite.config.ts define orqali kelishi mumkin)
  if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
    return (process.env as any)[key];
  }

  return defaultValue;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://utkeynqloxshfytjclvt.supabase.co');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_XiGjZA59fWnjQ3LO0Enoqg_wZtwSP_0');

export const supabase = createClient(supabaseUrl, supabaseKey);