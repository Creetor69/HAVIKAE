import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone config for the offline compiler build
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  }
});
