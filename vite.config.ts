import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relative : fonctionne sur https://<user>.github.io/lsfree/ sans configuration
export default defineConfig({
  base: './',
  plugins: [react()],
})
