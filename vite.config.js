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
          '<title>LMDT 2.0 · 劳动经济学机制仿真与数据实践平台</title>',
          '<title>劳动经济学机制仿真与数据实践平台</title>',
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
