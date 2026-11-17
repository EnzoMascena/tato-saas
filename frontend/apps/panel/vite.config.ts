import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El alias @ (lo usa shadcn/ui) se define una sola vez, en los paths de tsconfig.app.json.
  resolve: { tsconfigPaths: true },
})
