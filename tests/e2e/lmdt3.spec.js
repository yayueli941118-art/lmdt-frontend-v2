import { expect, test } from '@playwright/test'

test('数据分析中心加载教学样本并明确来源边界', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/#/analysis/market')
  await expect(page.getByRole('heading', { name: '劳动力市场数据分析中心' })).toBeVisible()
  await expect(page.getByText('教学示例数据', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('数据质量', { exact: true }).first()).toBeVisible()
  await expect(page.getByTestId('workspace-chart')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)).toBeLessThanOrEqual(1)
})

test('预测实验先判断后显示回测并保持同屏', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/#/forecast/basic')
  await expect(page.getByText('等待第一次判断', { exact: true })).toBeVisible()
  await page.getByRole('radio', { name: '扩张' }).check()
  await page.getByPlaceholder(/请引用趋势/).fill('最近三期总体上升，但仍需用留出期回测方法误差。')
  await page.getByRole('button', { name: '提交第一次判断' }).click()
  await expect(page.getByText('MAE', { exact: true })).toBeVisible()
  await expect(page.getByText('乐观和悲观线来自人为增长修正，不是统计置信区间。')).toBeVisible()
  await expect(page.getByTestId('workspace-chart')).toBeInViewport()
})

test('AI岗位实验实时更新并保存兼容报告记录', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/#/lab/ai-occupation')
  const before = await page.getByTestId('workspace-metrics').innerText()
  await page.getByText('任务替代强度').locator('..').locator('input').fill('90')
  await expect.poll(() => page.getByTestId('workspace-metrics').innerText()).not.toBe(before)
  await page.getByRole('button', { name: '实验记录' }).click()
  await page.getByRole('button', { name: '保存到报告工作台' }).click()
  await page.getByRole('link', { name: '带入劳动需求实验' }).click()
  await expect(page).toHaveURL(/#\/lab\/enterprise\?preset=ai/)
  await expect(page.getByRole('button', { name: 'AI情景' })).toHaveClass(/active/)
  await expect(page.getByText('短期就业', { exact: true })).toBeVisible()
  await page.goto('/#/report/workbench')
  await page.getByRole('button', { name: '完整项目版' }).click()
  await expect(page.locator('.record-list').getByText('AI岗位任务重构', { exact: true })).toBeVisible()
})

test('企业需求AI页签区分短期替代与长期互补', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/#/lab/enterprise')
  await page.getByRole('button', { name: 'AI情景' }).click()
  await expect(page.getByText('短期就业', { exact: true })).toBeVisible()
  await expect(page.getByText('长期就业', { exact: true })).toBeVisible()
  await expect(page.getByText(/不是现实企业招聘预测/)).toBeVisible()
  await expect(page.getByTestId('workspace-chart')).toBeInViewport()
})

test('人力资本职业能力页签展示13项自评与90天计划', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lmdtIndividualGateUnlocked', 'true'))
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/#/lab/individual')
  await page.getByRole('button', { name: '职业能力' }).click()
  await expect(page.getByText('13项职业能力：当前状态与目标要求')).toBeVisible()
  await expect(page.getByText(/不是心理诊断/)).toBeVisible()
  await page.getByRole('button', { name: '更多分析' }).click()
  await expect(page.getByText('90天能力投资计划')).toBeVisible()
})

test('能力训练提交前不泄露答案，提交后保存100分蓝图结果', async ({ page }) => {
  await page.goto('/#/practice/exam')
  await expect(page.locator('.question-card')).toBeVisible()
  await expect(page.getByText('判断正确')).toBeHidden()
  for (let index = 0; index < 10; index += 1) {
    const current = page.locator('.question-card')
    const numeric = current.locator('input[type="number"]')
    if (await numeric.count()) await numeric.fill('0')
    else {
      const options = current.locator('input:not([type="number"])')
      if (await options.count()) await options.first().check()
    }
    await expect(page.getByText(`${index + 1}/10`, { exact: true })).toBeVisible()
    if (index < 9) await page.getByRole('button', { name: '下一题' }).click()
  }
  await page.getByRole('button', { name: '提交全部答案' }).click()
  await expect(page.getByText(/完成第1次训练/)).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lmdtExamPracticeRecords') || '[]').length)).toBe(1)
})
