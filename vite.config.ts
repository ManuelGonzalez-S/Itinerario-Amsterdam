import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Se despliega en Vercel, que sirve el sitio en la raiz del dominio.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
