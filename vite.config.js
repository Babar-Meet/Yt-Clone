import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allows access from other devices on network
    open: true, // Open browser automatically
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  css: {
    devSourcemap: true,
  },
})