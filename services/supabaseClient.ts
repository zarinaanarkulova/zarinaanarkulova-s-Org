
import { createClient } from '@supabase/supabase-js';

// Vite muhitida o'zgaruvchilarni olish
const getEnv = (key: string, defaultValue: string): string => {
  const env = (import.meta as any).env;
  return env && env[key] ? env[key] : defaultValue;
};

// DIQQAT: Bu URL va KEY sizning loyihangizga mos ekanligiga ishonch hosil qiling.
// Agar Netlify'da ishlatsangiz, bularni Dashboard -> Site settings -> Environment variables bo'limiga qo'shing.
const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://utkeynqloxshfytjclvt.supabase.co');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0a2V5bnFsb3hzaGZ5dGpjbHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjkzODIsImV4cCI6MjA1NjA0NTM4Mn0.your-real-key-here');

// Agar hardcoded key sb_publishable bilan boshlansa, bu noto'g'ri bo'lishi mumkin. 
// Supabase anon key har doim "eyJ..." bilan boshlanadi.
export const supabase = createClient(supabaseUrl, supabaseKey);
