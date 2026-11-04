import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset URLs let the app work both at a domain root and under a
  // GitHub Pages repository path (for example, /RUBIKS_web/).
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
})
