import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Muhit o'zgaruvchilarini browser uchun process.env ob'ektiga xaritlaydi
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts-vendor': ['recharts'],
          'ai-vendor': ['@google/genai'],
          'db-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
});