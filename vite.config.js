import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_PAGES === 'true' ? '/lmdt-frontend-v2/' : '/',
  plugins: [
    vue(),
    {
      name: 'anonymous-html',
      transformIndexHtml(html) {
        if (mode !== 'anonymous') return html
        return html.replace(
          '<title>LMDT 3.0 · AI劳动力市场分析、机制仿真与预测实验室</title>',
          '<title>Labor Market Analysis & Forecast Lab</title>',
        )
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_MODE__: JSON.stringify(mode),
    __IS_STATIC_BUILD__: JSON.stringify(process.env.GITHUB_PAGES === 'true' || mode === 'anonymous'),
    __ANONYMOUS_BUILD__: JSON.stringify(mode === 'anonymous'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts') || id.includes('node_modules/vue-echarts')) return 'charts'
          if (id.includes('node_modules/vue') || id.includes('node_modules/axios')) return 'vendor'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}))
