import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to gRPC gateway during local dev
      '/api': {
        target: 'http://139.28.222.246:80',
        changeOrigin: true,
      },
    },
  },
});
