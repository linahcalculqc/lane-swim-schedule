import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ottrec': {
        target: 'https://data.ottrec.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ottrec/, ''),
      }
    }
  }
})