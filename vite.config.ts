import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Removed API key exposure - now using backend proxy
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.DEFAULT_WALLET_ADDRESS': JSON.stringify(env.DEFAULT_WALLET_ADDRESS || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
