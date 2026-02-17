import { createClient } from '@supabase/supabase-js';

/**
 * Vite environment variables safely.
 * In some build environments import.meta.env might be undefined during initial parse.
 */
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://utkeynqloxshfytjclvt.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XiGjZA59fWnjQ3LO0Enoqg_wZtwSP_0';

export const supabase = createClient(supabaseUrl, supabaseKey);