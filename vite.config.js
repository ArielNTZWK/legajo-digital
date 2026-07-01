import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Emitir todos los assets como archivos (no inline) para que los logos
    // sean reemplazables de forma predecible.
    assetsInlineLimit: 0,
  },
})
