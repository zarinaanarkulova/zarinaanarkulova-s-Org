import { createClient } from '@supabase/supabase-js';

/**
 * Vite muhit o'zgaruvchilariga xavfsiz kirish.
 * 'import.meta.env' ob'ekti mavjudligini tekshiramiz, aks holda bo'sh ob'ekt qaytaramiz.
 */
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://utkeynqloxshfytjclvt.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XiGjZA59fWnjQ3LO0Enoqg_wZtwSP_0';

export const supabase = createClient(supabaseUrl, supabaseKey);