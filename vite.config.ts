import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // Our main app bundle can exceed Workbox's default 2 MiB precache limit.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        id: '/portal',
        name: 'FaceAttend Student',
        short_name: 'MyAttend',
        description: 'Portail de présence étudiant FaceAttend',
        theme_color: '#020617',
        start_url: '/portal',
        scope: '/portal',
        display: 'standalone',
        background_color: '#020617',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
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
