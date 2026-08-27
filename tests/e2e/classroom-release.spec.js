import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('lmdtIndividualGateUnlocked', 'true')
  })
})

test('三种模式读取同一份正式课程口径', async ({ page }) => {
  for (const mode of ['teaching', 'competition', 'anonymous']) {
    await page.goto(`/?mode=${mode}#/`)
    const assessment = page.locator('.assessment-band')
    await expect(assessment).toContainText('考查课 · 32学时')
    await expect(assessment).toContainText('课堂实践与过程证据')
    await expect(assessment).toContainText('个人实践档案')
    await expect(assessment).toContainText('小组综合项目')
    await expect(assessment).toContainText('个人综合实践考查')
  }
})

test('课堂五步从教学样本走到有边界的报告结论', async ({ page }) => {
  await page.goto('/#/report/workbench')
  await page.getByTestId('load-teaching-example').click()
  await expect(page.getByText('8 条样本已进入当前浏览器')).toBeVisible()
  await page.getByTestId('classroom-next').click()

  await page.getByTestId('confirm-classroom-quality').click()
  await page.getByTestId('classroom-next').click()
  await expect(page.getByText('平均薪资', { exact: true }).first()).toBeVisible()

  await page.getByTestId('confirm-classroom-stats').click()
  await page.getByTestId('classroom-next').click()
  await expect(page.getByText('当前推荐')).toBeVisible()

  await page.getByTestId('classroom-simulation-link').click()
  await expect(page.getByTestId('experiment-workspace')).toBeVisible()
  await page.goBack()
  await expect(page.getByTestId('classroom-step-4')).toHaveClass(/complete/)
  await page.getByTestId('classroom-next').click()

  await page.getByTestId('generate-classroom-conclusion').click()
  await expect(page.getByTestId('classroom-conclusion')).toContainText('不能直接推出')
  await page.getByRole('button', { name: '完整项目版' }).click()
  await expect(page.getByTestId('project-workflow')).toBeVisible()
  await expect(page.locator('.table-panel tbody tr')).toHaveCount(8)
  await expect(page.locator('.report-textarea')).toHaveValue(/课堂五步结论/)
})

test('完整项目版作业数据包可导出、清空并重新导入', async ({ page }) => {
  await page.goto('/#/report/workbench')
  await page.getByTestId('load-teaching-example').click()
  await page.getByRole('button', { name: '完整项目版' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出作业数据包' }).click()
  const download = await downloadPromise
  const path = await download.path()

  let dialogIndex = 0
  const dismissSecond = async dialog => {
    dialogIndex += 1
    if (dialogIndex === 1) await dialog.accept()
    else await dialog.dismiss()
  }
  page.on('dialog', dismissSecond)
  await page.getByRole('button', { name: '清空本机数据' }).click()
  page.off('dialog', dismissSecond)
  await expect(page.locator('.table-panel tbody tr')).toHaveCount(8)

  page.on('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '清空本机数据' }).click()
  page.removeAllListeners('dialog')
  await expect(page.locator('.empty-cell')).toBeVisible()

  await page.locator('input[accept=".json,application/json"]').first().setInputFiles(path)
  await expect(page.locator('.table-panel tbody tr')).toHaveCount(8)
  await expect(page.getByText(/已导入作业数据包：8 条样本/)).toBeVisible()
})

const presetRoutes = [
  '/lab/supply', '/lab/enterprise', '/lab/individual', '/lab/migration', '/lab/wage',
  '/lab/discrimination', '/lab/income-distribution', '/lab/unemployment', '/lab/ai-occupation', '/lab/chengyu-tourism',
]

for (const route of presetRoutes) {
  test(`${route} 的教师预设驱动真实结果并保留六步任务`, async ({ page }) => {
    await page.goto(`/#${route}`)
    await expect(page.getByTestId('classroom-preset-baseline')).toBeVisible()
    await expect(page.getByTestId('classroom-preset-conflict')).toBeVisible()
    await expect(page.getByTestId('classroom-preset-reality')).toBeVisible()
    const before = await page.locator('input[type="range"], select').evaluateAll(elements => elements.map(element => element.value).join('|'))
    const beforeMetrics = await page.getByTestId('workspace-metrics').innerText()
    await page.getByTestId('classroom-preset-conflict').click()
    await expect(page.getByTestId('classroom-preset-conflict')).toHaveClass(/active/)
    await page.waitForTimeout(450)
    const after = await page.locator('input[type="range"], select').evaluateAll(elements => elements.map(element => element.value).join('|'))
    const afterMetrics = await page.getByTestId('workspace-metrics').innerText()
    expect(`${after}\n${afterMetrics}`).not.toBe(`${before}\n${beforeMetrics}`)
    await page.getByTestId('classroom-preset-reality').click()
    await expect(page.getByTestId('classroom-preset-reality')).toHaveClass(/active/)
    await page.waitForTimeout(450)
    await expect(page.getByTestId('workspace-chart')).toBeVisible()
    await page.getByRole('button', { name: '实验任务', exact: true }).click()
    await expect(page.getByText('1 · 先预测')).toBeVisible()
    await expect(page.getByText('6 · 保存并提交')).toBeVisible()
  })
}
