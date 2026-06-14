import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const userscriptDist = resolve(__dirname, '../userscripts/dist');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-userscript',
      closeBundle() {
        try {
          cpSync(userscriptDist, resolve(__dirname, 'dist/dist'), { recursive: true });
        }
        catch {
          console.warn('Userscript dist not found, skipping copy');
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
