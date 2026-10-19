import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative Pfade, damit die App auf GitHub Pages unter /Bissfibel/ läuft.
export default defineConfig({
  base: './',
  plugins: [react()],
});
