// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig(() => ({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
//   server: {
//     port: 3000,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8000',
//         changeOrigin: true,
//       },
//       '/storage': {
//         target: 'http://localhost:8000',
//         changeOrigin: true,
//       },
//     },
//   },
//   // base: '/suki-cart/',
// }))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => ({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: '../cordova/www',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.123.2:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://192.168.123.2:8000',
        changeOrigin: true,
      },
    },
  },
}))