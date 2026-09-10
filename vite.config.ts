import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { name } from './package.json'

export default defineConfig({
  base: `/${name}/`,
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
})
