import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'FaceAttend Student',
        short_name: 'MyAttend',
        description: 'Portail de présence étudiant FaceAttend',
        theme_color: '#020617',
        start_url: '/portal',
        scope: '/',
        display: 'standalone',
        background_color: '#020617',
        icons: [
          {
            src: 'logo5.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: 'logo5.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: 'logo5.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // Nécessaire pour l'accès mobile via IP
    watch: {
      ignored: ['**/venv/**', '**/dist/**', '**/*.log'],
    },
  },
});
