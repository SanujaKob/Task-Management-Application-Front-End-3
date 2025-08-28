import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Let Vite read from parent dir (your original setting)
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    // ✅ Proxy API calls to FastAPI backend
    proxy: {
      '/api': {
        // Use env if set; otherwise default to your local FastAPI
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // No rewrite needed since backend is also mounted at /api
        // rewrite: (p) => p,
      },
    },
  },
})
