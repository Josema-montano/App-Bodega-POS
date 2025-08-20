import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// Configuración temporal simplificada para resolver errores
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  server: {
    host: true,
    port: 5173
  }
})
