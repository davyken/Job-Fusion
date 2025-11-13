/* eslint-disable no-undef */
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-scroll-area', '@radix-ui/react-label', '@radix-ui/react-dialog'],
          clerk: ['@clerk/clerk-react'],
          supabase: ['@supabase/supabase-js'],
          utils: ['lucide-react', 'react-router-dom', 'react-hook-form'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
