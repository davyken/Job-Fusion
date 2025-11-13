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
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('@clerk')) {
              return 'clerk';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('react-router') || id.includes('react-hook-form')) {
              return 'routing';
            }
            if (id.includes('@uiw/react-md-editor') || id.includes('mammoth') || id.includes('react-markdown')) {
              return 'editor';
            }
            if (id.includes('refractor') || id.includes('prism')) {
              return 'syntax';
            }
            if (id.includes('mammoth') || id.includes('xlsx') || id.includes('pdf')) {
              return 'file-processing';
            }
            if (id.includes('react-spinners') || id.includes('country-state-city')) {
              return 'ui-libs';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 10000,
  },
});
