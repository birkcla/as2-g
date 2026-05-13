import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/as2-graph-viewer/',
  build: {
    outDir: 'docs'
  }
})
