import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Target Safari 13.1+, Firefox 78+, Chrome 80+, Edge 88+
    // Prevents blank screen caused by modern JS syntax rejected by older mobile browsers
    target: ['chrome80', 'firefox78', 'safari13.1', 'edge88'],
    // Suppress the large bundle warning (single-page app)
    chunkSizeWarningLimit: 800
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});