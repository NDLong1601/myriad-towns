import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// BASE_PATH is set by the GitHub Pages workflow to "/<repo-name>/".
// Locally it stays "/" so `npm run dev` and `npm run preview` work at the root.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // three.js alone is ~550 kB minified (~140 kB gzip); revisit with code-splitting in M6.
    chunkSizeWarningLimit: 800,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
