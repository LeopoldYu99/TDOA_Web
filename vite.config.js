import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.TDOA_API_TARGET || 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  }
})
