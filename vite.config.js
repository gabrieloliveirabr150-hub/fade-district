import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Each HTML page of the site must be listed here so `npm run build` includes it.
// services.html will be added in a later step.
export default defineConfig({
  build: {
    // The 3D razor chunk is mostly Three.js (~145 kB gzipped). It is loaded
    // on demand after the page renders, so the default 500 kB warning is
    // raised slightly instead of being ignored.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
});
