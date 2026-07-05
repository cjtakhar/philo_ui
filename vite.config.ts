import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensures assets are served from the root of philomechanicus.ai
  server: {
    // honor an externally assigned port (e.g. preview harness); default 5173
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})