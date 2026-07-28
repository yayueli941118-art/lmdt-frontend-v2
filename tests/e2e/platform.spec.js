import { expect, test } from '@playwright/test'

const coreRoutes = [
  ['/', '劳动经济学机制仿真'],
  ['/lab/supply', '劳动供给决策'],
  ['/lab/enterprise', '劳动需求'],
  ['/lab/individual', '在进入实验室之前'],
  ['/lab/migration', '城市迁移决策模拟'],
  ['/lab/wage', '工资决定与工资形式'],
  ['/lab/discrimination', '歧视机制与工资差距分解'],
  ['/lab/income-distribution', '收入分配实验室'],
  ['/lab/unemployment', '失业、工作搜寻与匹配'],
  ['/lab/chengyu-tourism', '成渝文旅产业实验室'],
  ['/report/workbench', '岗位劳动力市场预测报告工作台'],
]

test('教学模式核心路由均可加载且无水平溢出', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  for (const [route, title] of coreRoutes) {
    await page.goto(`/#${route}`)
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible()
    await page.waitForTimeout(350)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${route} 不应横向溢出`).toBeLessThanOrEqual(1)
  }
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('旗舰实验可调参、恢复并保存到报告工作台', async ({ page }) => {
  await page.goto('/#/lab/supply?preset=moreWork')
  const wageSlider = page.locator('input[type="range"]').nth(1)
  await wageSlider.fill('80')
  await expect(wageSlider).toHaveValue('80')
  await page.getByRole('button', { name: '恢复当前教材预设' }).click()
  await expect(wageSlider).toHaveValue('64')

  await page.getByRole('button', { name: '保存到报告工作台' }).click()
  await expect(page.getByText('已保存到当前浏览器的报告工作台')).toBeVisible()
  await page.goto('/#/report/workbench')
  await expect(page.locator('.record-list').getByText('劳动供给决策', { exact: true })).toBeVisible()
})

test('竞赛模式提供导览和三个可操作预设', async ({ page }) => {
  await page.goto('/?mode=competition#/')
  await expect(page.getByText('竞赛版', { exact: true })).toBeVisible()
  await expect(page.getByText('5 分钟评委导览')).toBeVisible()
  await expect(page.locator('.preset-row a')).toHaveCount(3)
  await page.getByRole('link', { name: /数字文旅升级/ }).click()
  await expect(page).toHaveURL(/chengyu-tourism/)
  await expect(page.getByRole('heading', { level: 1, name: '成渝文旅产业实验室' })).toBeVisible()
  await expect(page.locator('select').nth(1)).toHaveValue('数字文博')
})

test('匿名模式隐藏身份并保留核心功能', async ({ page }) => {
  await page.goto('/?mode=anonymous#/')
  await expect(page.getByText('匿名版', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'LM Simulation', exact: true })).toBeVisible()
  const body = await page.locator('body').innerText()
  expect(body).not.toContain('黎雅月')
  expect(body).not.toContain('西南交通大学希望学院')
  await page.goto('/?mode=anonymous#/lab/chengyu-tourism')
  await expect(page.getByRole('heading', { level: 1, name: '成渝文旅产业实验室' })).toBeVisible()
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`报告工作台适配 ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#/report/workbench')
    await expect(page.getByRole('heading', { name: '岗位劳动力市场预测报告工作台' })).toBeVisible()
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}
