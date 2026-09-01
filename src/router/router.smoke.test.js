import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const routerSource = readFileSync(resolve('src/router/index.js'), 'utf8')
const requiredRoutes = [
  '/',
  '/analysis/market',
  '/forecast/basic',
  '/practice/labor-market-indicators',
  '/practice/exam',
  '/lab/individual',
  '/lab/enterprise',
  '/lab/supply',
  '/lab/factor-allocation',
  '/lab/migration',
  '/lab/wage',
  '/lab/discrimination',
  '/lab/income-distribution',
  '/lab/unemployment',
  '/lab/chengyu-tourism',
  '/lab/ai-occupation',
  '/report/workbench',
]

describe('核心路由烟雾契约', () => {
  it.each(requiredRoutes)('保留路由 %s', route => {
    expect(routerSource).toContain(`path: '${route}'`)
  })

  it('所有路由引用的视图文件存在', () => {
    const viewNames = [...routerSource.matchAll(/views\/([A-Za-z]+\.vue)/g)].map(match => match[1])
    expect(viewNames.length).toBeGreaterThan(0)
    for (const view of new Set(viewNames)) {
      expect(existsSync(resolve('src/views', view)), view).toBe(true)
    }
  })
})
