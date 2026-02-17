
import { createClient } from '@supabase/supabase-js';

// Vite config'da 'define' qilingan process.env ob'ektidan foydalanamiz
// Agar muhit o'zgaruvchilari mavjud bo'lmasa, taqdim etilgan kalitlardan foydalanamiz
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://utkeynqloxshfytjclvt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XiGjZA59fWnjQ3LO0Enoqg_wZtwSP_0';

if (!supabaseKey) {
  console.error("Supabase API kaliti topilmadi. Tizim ishlamasligi mumkin.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
