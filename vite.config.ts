import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    host: '::',
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@tanstack')) return 'react-query';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('react-router')) return 'router';
          return 'vendor';
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './packages/shared/src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query', '@tanstack/query-core'],
  },
});
