import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base, damit die App unter jedem Pfad läuft (GitHub Pages, Netlify, Vercel …)
export default defineConfig({
  base: './',
  plugins: [react()],
})
