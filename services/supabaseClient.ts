import { createClient } from '@supabase/supabase-js';

const isValidUrl = (url: string | undefined): boolean => 
  !!url && typeof url === 'string' && url.startsWith('http');

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envDbUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;

const supabaseUrl = isValidUrl(envUrl) 
  ? envUrl 
  : (isValidUrl(envDbUrl) ? envDbUrl : 'https://utkeynqloxshfytjclvt.supabase.co');

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0a2V5bnFsb3hzaGZ5dGpjbHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzE4NDUsImV4cCI6MjA4NjkwNzg0NX0.BOhUku8K7Ov9WOD1h0WJxTUZi5wCABYpEBAiBoanLyg';

export const supabase = createClient(supabaseUrl, supabaseKey);
