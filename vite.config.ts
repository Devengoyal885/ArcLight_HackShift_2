import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lc-api': {
        target: 'https://leetcode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lc-api/, '/graphql'),
        headers: {
          'Origin': 'https://leetcode.com',
          'Referer': 'https://leetcode.com/',
        },
      },
    },
  },
})
