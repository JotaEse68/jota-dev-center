import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El servidor Express corre en 3334 durante el desarrollo.
// Vite sirve el frontend en 3333 y hace proxy de /api hacia el backend.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3333,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3334',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
