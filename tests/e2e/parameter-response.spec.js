import { expect, test } from '@playwright/test'

const experimentRoutes = [
  ['劳动供给', '/lab/supply'],
  ['劳动需求', '/lab/enterprise'],
  ['要素配置', '/lab/factor-allocation'],
  ['人力资本', '/lab/individual'],
  ['劳动力流动', '/lab/migration'],
  ['工资理论', '/lab/wage'],
  ['歧视与分解', '/lab/discrimination'],
  ['收入分配', '/lab/income-distribution'],
  ['失业与匹配', '/lab/unemployment'],
  ['宏观政策', '/lab/macro'],
  ['成渝文旅', '/lab/chengyu-tourism'],
  ['AI岗位任务', '/lab/ai-occupation'],
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lmdtIndividualGateUnlocked', 'true')
  })
  await page.setViewportSize({ width: 1366, height: 768 })
})

async function feedbackFingerprint(page) {
  return page.evaluate(() => {
    const chart = document.querySelector('[data-testid="workspace-chart"]')
    const canvas = chart?.querySelector('canvas')
    let canvasHash = 0
    if (canvas?.width && canvas?.height) {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      const stride = Math.max(4, Math.floor(pixels.length / 1000 / 4) * 4)
      for (let index = 0; index < pixels.length; index += stride) {
        canvasHash = ((canvasHash * 33) ^ pixels[index] ^ pixels[index + 1] ^ pixels[index + 2]) >>> 0
      }
    }
    return JSON.stringify({
      canvasHash,
      metrics: document.querySelector('[data-testid="workspace-metrics"]')?.textContent || '',
      change: document.querySelector('[data-testid="workspace-change"]')?.textContent || '',
    })
  })
}

async function setAlternativeValue(control) {
  const original = await control.inputValue()
  const tagName = await control.evaluate(element => element.tagName)
  if (tagName === 'SELECT') {
    const options = await control.locator('option').evaluateAll(elements => elements.map(element => element.value))
    const alternative = options.find(value => value !== original)
    if (alternative === undefined) return null
    await control.selectOption(alternative)
    return original
  }

  const range = await control.evaluate(element => ({
    min: Number(element.min || 0),
    max: Number(element.max || 100),
    value: Number(element.value),
    step: Number(element.step || 1),
  }))
  const span = range.max - range.min
  const target = range.value < range.min + span / 2
    ? Math.max(range.min, range.max - range.step)
    : Math.min(range.max, range.min + range.step)
  if (target === range.value) return null
  await control.evaluate((element, value) => {
    element.value = String(value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }, target)
  return original
}

async function restoreValue(control, value) {
  const tagName = await control.evaluate(element => element.tagName)
  if (tagName === 'SELECT') {
    await control.selectOption(value)
    return
  }
  await control.evaluate((element, original) => {
    element.value = original
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

for (const [name, route] of experimentRoutes) {
  test(`${name}每个可见参数都驱动当前反馈`, async ({ page }) => {
    await page.goto(`/#${route}`)
    await expect(page.getByTestId('experiment-workspace')).toBeVisible()
    await expect(page.getByTestId('workspace-chart').locator('canvas').first()).toBeVisible()
    await page.waitForTimeout(500)

    const groups = [
      page.getByTestId('workspace-controls').locator('input[type="range"]:visible'),
      page.getByTestId('workspace-controls').locator('select:visible'),
    ]
    const total = (await groups[0].count()) + (await groups[1].count())
    expect(total, '动态实验至少应有一个可操作参数').toBeGreaterThan(0)

    for (const controls of groups) {
      const count = await controls.count()
      for (let index = 0; index < count; index += 1) {
        const control = controls.nth(index)
        await control.scrollIntoViewIfNeeded()
        const chart = page.getByTestId('workspace-chart')
        await expect(chart).toBeInViewport()
        const before = await feedbackFingerprint(page)
        const original = await setAlternativeValue(control)
        if (original === null) continue
        await expect.poll(() => feedbackFingerprint(page), {
          message: `${name}第 ${index + 1} 个参数变化后，主图、指标或变化提示至少一项应更新`,
          timeout: 2_500,
        }).not.toBe(before)
        await expect(chart).toBeInViewport()
        await restoreValue(control, original)
        await page.waitForTimeout(180)
      }
    }
  })
}
