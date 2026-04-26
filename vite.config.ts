import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/word-match/',
  plugins: [react()],
  server: {
    port: 8000
  },
  test: {
    environment: 'node'
  }
});