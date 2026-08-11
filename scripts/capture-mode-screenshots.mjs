import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const baseUrl = process.env.LMDT_CAPTURE_URL || 'http://127.0.0.1:5173'
const outputDir = new URL('../docs/screenshots/', import.meta.url)
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

for (const viewport of [
  { width: 1440, height: 900, suffix: '' },
  { width: 390, height: 844, suffix: '-mobile' },
]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  for (const mode of ['teaching', 'competition', 'anonymous']) {
    await page.goto(`${baseUrl}/?mode=${mode}#/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    await page.screenshot({
      path: new URL(`${mode}-home${viewport.suffix}.png`, outputDir).pathname.slice(1),
      fullPage: false,
    })
  }
}

await browser.close()
