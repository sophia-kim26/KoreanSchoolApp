import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    // Add this to handle client-side routing
    proxy: {
      // This isn't needed for routing, but I'm showing the structure
    }
  },
  env: {
    AUTH0_BASE_URL: process.env.VERCEL_URL || process.env.AUTH0_BASE_URL,
  },
  // This is important - but might not work in dev server
  // You may need the historyApiFallback approach below instead
});