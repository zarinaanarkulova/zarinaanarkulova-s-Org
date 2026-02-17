
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utkeynqloxshfytjclvt.supabase.co';
const supabaseKey = 'sb_publishable_XiGjZA59fWnjQ3LO0Enoqg_wZtwSP_0';

export const supabase = createClient(supabaseUrl, supabaseKey);
