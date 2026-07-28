import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.LMDT_AUDIT_URL || 'http://127.0.0.1:4173'
const phase = process.env.LMDT_AUDIT_PHASE || 'before'
const routes = [
  ['supply', '/lab/supply'],
  ['enterprise', '/lab/enterprise'],
  ['factor-allocation', '/lab/factor-allocation'],
  ['individual', '/lab/individual'],
  ['migration', '/lab/migration'],
  ['wage', '/lab/wage'],
  ['discrimination', '/lab/discrimination'],
  ['income-distribution', '/lab/income-distribution'],
  ['unemployment', '/lab/unemployment'],
  ['macro', '/lab/macro'],
  ['chengyu-tourism', '/lab/chengyu-tourism'],
]
const viewports = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
]

const outputRoot = path.resolve('docs/screenshots/one-screen', phase)
await mkdir(outputRoot, { recursive: true })

const browser = await chromium.launch()
const audit = []

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport })
  await page.addInitScript(() => {
    localStorage.setItem('lmdtIndividualGateUnlocked', 'true')
  })

  for (const [slug, route] of routes) {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    const geometry = await page.evaluate(() => {
      const rect = selector => {
        const element = document.querySelector(selector)
        if (!element) return null
        const box = element.getBoundingClientRect()
        return {
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
          left: Math.round(box.left),
          right: Math.round(box.right),
          width: Math.round(box.width),
          height: Math.round(box.height),
        }
      }
      const sliders = [...document.querySelectorAll('input[type="range"]')]
      const visibleSliders = sliders.filter(element => {
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      })
      const inViewport = box => box && box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth
      const mainChart = rect('[data-testid="workspace-chart"], .main-chart, .chart-card, .chart-container')
      const controls = rect('[data-testid="workspace-controls"], .lab-dashboard-side, .lab-sidebar, .lab-controls, .control-band')
      const metrics = rect('[data-testid="workspace-metrics"], .cards-row, .metric-grid, .metrics-grid, .metrics-row')

      return {
        viewport: { width: innerWidth, height: innerHeight },
        document: {
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        },
        controls,
        mainChart,
        metrics,
        visibleSliderCount: visibleSliders.length,
        slidersInViewport: visibleSliders.filter(element => inViewport(element.getBoundingClientRect())).length,
        controlsInViewport: inViewport(controls),
        chartInViewport: inViewport(mainChart),
        metricsInViewport: inViewport(metrics),
      }
    })

    audit.push({ phase, route, slug, viewport, ...geometry })
    await page.screenshot({
      path: path.join(outputRoot, `${slug}-${viewport.width}x${viewport.height}.png`),
      fullPage: false,
    })
  }
  await page.close()
}

await browser.close()
await writeFile(
  path.resolve(`docs/one-screen-audit-${phase}.json`),
  `${JSON.stringify(audit, null, 2)}\n`,
  'utf8',
)

console.log(`同屏审计完成：${audit.length} 个路由/视口组合，阶段 ${phase}。`)
