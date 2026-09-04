import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: el sitio se sirve en https://<user>.github.io/Itinerario-Amsterdam/
export default defineConfig({
  base: '/Itinerario-Amsterdam/',
  plugins: [react(), tailwindcss()],
})
