import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1337',
        changeOrigin: true,
        secure: false
      },
      // also proxy /uploads so <img src="/uploads/..."> works in dev
      // (Strapi serves uploaded files as static under /uploads)
      '/uploads': {
        target: 'http://localhost:1337',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
