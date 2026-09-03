import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.LMDT_PREVIEW_URL || 'http://127.0.0.1:4174'
const outputDir = resolve('docs/screenshots/l02-practice')
const templatePath = resolve('public/templates/实践一_劳动力市场指标诊断_学生Excel模板_V1.0.xlsx')
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()
try {
  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await page.goto(`${baseUrl}/#/practice/labor-market-indicators`)
    await page.getByRole('heading', { name: '劳动力市场指标诊断' }).waitFor()
    await page.screenshot({ path: resolve(outputDir, `${name}-empty.png`), fullPage: true })
    await page.getByTestId('v1-upload').setInputFiles(templatePath)
    await page.getByTestId('v1-audit-report').waitFor()
    await page.screenshot({ path: resolve(outputDir, `${name}-rejected.png`), fullPage: true })
    await page.close()
  }
} finally {
  await browser.close()
}
