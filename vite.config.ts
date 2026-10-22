import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative Pfade, damit die App auf GitHub Pages unter /Bissfibel/ läuft.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Installierbar und offline nutzbar: App-Dateien und Schriften werden auf dem Gerät gespeichert.
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'], maximumFileSizeToCacheInBytes: 8 * 1024 * 1024 },
      includeAssets: ['app-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bissfibel',
        short_name: 'Bissfibel',
        description: 'Wann und wo es sich für deinen Zielfisch lohnt – und was bei dir wirklich fängt.',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EEF2EF',
        theme_color: '#1F6F78',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
