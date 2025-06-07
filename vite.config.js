import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: '/',
  }

  // For Vercel, Netlify, or similar, API routes are typically handled by the platform's routing.
  // If you need to run a local Node.js server for /api during `vite dev` (e.g., for a custom server or Express),
  // you would configure the proxy here. For serverless functions, this is often not needed with their CLIs.
  // Example for a local server on port 3000:
  // if (command === 'serve') {
  //   config.server = {
  //     proxy: {
  //       '/api': {
  //         target: 'http://localhost:3000',
  //         changeOrigin: true,
  //       }
  //     }
  //   }
  // }
  return config;
})
