import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Each HTML page of the site must be listed here so `npm run build` includes it.
// services.html will be added in a later step.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
});
