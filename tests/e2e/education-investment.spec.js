import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1280, height: 800 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`education investment is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#/lab/individual')
    await page.getByRole('link', { name: /个人教育投资测算/ }).first().click()
    await expect(page.getByRole('heading', { name: '个人教育投资测算' })).toBeVisible()
    await expect(page.locator('.investment-chart canvas')).toBeVisible()
    const chartBox = await page.locator('.investment-chart').boundingBox()
    expect(chartBox.y).toBeGreaterThanOrEqual(0)
    expect(chartBox.y + chartBox.height).toBeLessThanOrEqual(viewport.height + 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)

    const original = await page.locator('.investment-metrics strong').first().textContent()
    const slider = page.getByTestId('observation-slider')
    await slider.fill('8')
    await expect(page.getByTestId('year-detail')).toContainText('第 8 年')
    await expect(page.locator('.investment-metrics strong').first()).not.toHaveText(original)
    await page.waitForTimeout(800)
    const changedBox = await page.locator('.investment-chart').boundingBox()
    expect(changedBox.y + changedBox.height).toBeLessThanOrEqual(viewport.height + 1)
    await page.screenshot({ path: `test-results/education-investment-${viewport.width}x${viewport.height}.png`, fullPage: true })
  })
}

test('discount scenarios and the three-sentence judgment copy use current assumptions', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#/lab/education-investment')
  await page.getByRole('button', { name: '8% · 高' }).click()
  await expect(page.locator('.discount-field')).toContainText('8.0%/年')
  const answers = page.locator('.judgment textarea')
  await answers.nth(0).fill('原来会报考；现在先比较成本。')
  await answers.nth(1).fill('毕业后的增量收入。')
  await answers.nth(2).fill('增量收入下降时会重新选择。')
  await page.getByRole('button', { name: '复制我的教育投资判断' }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('折现率8.00%')
  expect(copied).toContain('教学情景，不是现实预测')
  expect(copied).toContain('原来会报考；现在先比较成本。')
  expect(copied).toContain('毕业后的增量收入。')
  expect(copied).toContain('增量收入下降时会重新选择。')
})
