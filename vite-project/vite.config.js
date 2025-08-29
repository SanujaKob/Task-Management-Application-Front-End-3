import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Accept VITE_API_URL like "http://127.0.0.1:8000" (no /api here)
  const target = (env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      fs: { allow: [path.resolve(__dirname, '..')] },
      proxy: {
        '/api': {
          target,          // -> http://127.0.0.1:8000
          changeOrigin: true,
          secure: false,
          // IMPORTANT: do NOT rewrite; backend expects /api prefix
          // rewrite: p => p,
        },
      },
    },
  }
})
