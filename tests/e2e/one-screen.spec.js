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
]

const desktopViewports = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

const mobileViewports = [
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lmdtIndividualGateUnlocked', 'true')
  })
})

async function waitForWorkspace(page, route) {
  await page.goto(`/#${route}`)
  await expect(page.getByTestId('experiment-workspace')).toBeVisible()
  await expect(page.getByTestId('workspace-chart').locator('canvas').first()).toBeVisible()
  await page.waitForTimeout(450)
}

async function measureWorkspace(page) {
  return page.evaluate(() => {
    const readRect = element => {
      const box = element?.getBoundingClientRect()
      if (!box) return null
      return {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      }
    }
    const controls = document.querySelector('[data-testid="workspace-controls"]')
    const chart = document.querySelector('[data-testid="workspace-chart"]')
    const metrics = document.querySelector('[data-testid="workspace-metrics"]')
    const canvas = chart?.querySelector('canvas')
    const controlScroll = controls?.querySelector('.workspace-control-scroll')
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrollY,
      controls: readRect(controls),
      chart: readRect(chart),
      metrics: readRect(metrics),
      canvas: readRect(canvas),
      canvasPixels: canvas ? { width: canvas.width, height: canvas.height } : null,
      controlsScrollable: controlScroll
        ? controlScroll.scrollHeight > controlScroll.clientHeight + 1
        : false,
    }
  })
}

function expectRectInside(rect, viewport, label) {
  expect(rect, `${label} 应存在`).not.toBeNull()
  const top = rect.top ?? rect.y
  const left = rect.left ?? rect.x
  const bottom = rect.bottom ?? (top + rect.height)
  const right = rect.right ?? (left + rect.width)
  expect(top, `${label} 顶部应在视口内`).toBeGreaterThanOrEqual(-1)
  expect(left, `${label} 左侧应在视口内`).toBeGreaterThanOrEqual(-1)
  expect(bottom, `${label} 底部应在视口内`).toBeLessThanOrEqual(viewport.height + 1)
  expect(right, `${label} 右侧应在视口内`).toBeLessThanOrEqual(viewport.width + 1)
}

async function feedbackFingerprint(page) {
  return page.evaluate(() => {
    const chart = document.querySelector('[data-testid="workspace-chart"]')
    const canvas = chart?.querySelector('canvas')
    let canvasHash = 0
    if (canvas?.width && canvas?.height) {
      const context = canvas.getContext('2d')
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      const stride = Math.max(4, Math.floor(pixels.length / 1200 / 4) * 4)
      for (let index = 0; index < pixels.length; index += stride) {
        canvasHash = ((canvasHash * 33) ^ pixels[index] ^ pixels[index + 1] ^ pixels[index + 2]) >>> 0
      }
    }
    return {
      canvasHash,
      metrics: document.querySelector('[data-testid="workspace-metrics"]')?.textContent || '',
      change: document.querySelector('[data-testid="workspace-change"]')?.textContent || '',
    }
  })
}

async function dragRangeWithChartVisible(page, slider) {
  await slider.scrollIntoViewIfNeeded()
  const beforeValue = await slider.inputValue()
  const beforeFeedback = await feedbackFingerprint(page)
  let feedbackChangedDuringDrag = false
  const range = await slider.evaluate(element => ({
    min: Number(element.min || 0),
    max: Number(element.max || 100),
    value: Number(element.value),
  }))
  const box = await slider.boundingBox()
  expect(box).not.toBeNull()

  const currentFraction = (range.value - range.min) / Math.max(range.max - range.min, 1)
  const targetFraction = currentFraction < 0.55 ? 0.82 : 0.18
  const startX = box.x + Math.max(8, Math.min(box.width - 8, box.width * currentFraction))
  const targetX = box.x + Math.max(8, Math.min(box.width - 8, box.width * targetFraction))
  const y = box.y + box.height / 2

  await page.mouse.move(startX, y)
  await page.mouse.down()
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.move(startX + ((targetX - startX) * step) / 6, y)
    await page.waitForTimeout(75)
    const chartBox = await page.getByTestId('workspace-chart').boundingBox()
    const viewport = page.viewportSize()
    expectRectInside(chartBox, viewport, '拖动中的主图')
    const liveFeedback = await feedbackFingerprint(page)
    feedbackChangedDuringDrag ||= liveFeedback.canvasHash !== beforeFeedback.canvasHash
      || liveFeedback.metrics !== beforeFeedback.metrics
  }
  expect(feedbackChangedDuringDrag, '松开滑块前图表或关键指标应已更新').toBe(true)
  await page.mouse.up()
  await expect(slider).not.toHaveValue(beforeValue)
}

for (const viewport of desktopViewports) {
  for (const [name, route] of experimentRoutes) {
    test(`${name}在 ${viewport.width}x${viewport.height} 同屏调参与观察`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await waitForWorkspace(page, route)

      const initial = await measureWorkspace(page)
      expect(initial.documentScroll, '实验主体不应产生页面级纵向滚动').toBeLessThanOrEqual(1)
      expect(initial.horizontalOverflow, '页面不应横向溢出').toBeLessThanOrEqual(1)
      expect(initial.scrollY).toBe(0)
      expectRectInside(initial.controls, initial.viewport, '参数面板')
      expectRectInside(initial.chart, initial.viewport, '主图')
      expectRectInside(initial.metrics, initial.viewport, '关键指标')
      expect(initial.chart.height, '主图不能被压扁').toBeGreaterThanOrEqual(300)
      expect(initial.canvasPixels?.width || 0, '图表画布宽度').toBeGreaterThan(300)
      expect(initial.canvasPixels?.height || 0, '图表画布高度').toBeGreaterThan(180)
      expect(initial.canvas.left).toBeGreaterThanOrEqual(initial.chart.left - 1)
      expect(initial.canvas.right).toBeLessThanOrEqual(initial.chart.right + 1)
      expect(initial.canvas.bottom).toBeLessThanOrEqual(initial.chart.bottom + 1)

      const sliders = page.getByTestId('workspace-controls').locator('input[type="range"]')
      expect(await sliders.count(), '每个动态实验应至少有一个连续参数').toBeGreaterThan(0)
      const slider = sliders.first()
      const before = await feedbackFingerprint(page)
      await dragRangeWithChartVisible(page, slider)
      await expect(page.getByTestId('experiment-workspace')).toHaveClass(/is-changing/)
      await page.waitForTimeout(700)
      const after = await feedbackFingerprint(page)
      expect(
        after.canvasHash !== before.canvasHash
          || after.metrics !== before.metrics
          || after.change !== before.change,
        '参数变化后图表数据或关键指标应发生变化',
      ).toBe(true)
      expect((await measureWorkspace(page)).scrollY).toBe(0)

      const chartTabs = page.locator('.workspace-chart-tabs button')
      if (await chartTabs.count() > 1) {
        const valuesBeforeTab = await sliders.evaluateAll(elements => elements.map(element => element.value))
        const activeTabIndex = await chartTabs.evaluateAll(elements =>
          Math.max(0, elements.findIndex(element => element.classList.contains('active'))))
        const otherTabIndex = activeTabIndex === 0 ? 1 : 0
        await chartTabs.nth(otherTabIndex).click()
        await page.waitForTimeout(120)
        await chartTabs.nth(activeTabIndex).click()
        await page.waitForTimeout(120)
        expect(await sliders.evaluateAll(elements => elements.map(element => element.value))).toEqual(valuesBeforeTab)
        expectRectInside(
          await page.getByTestId('workspace-chart').boundingBox(),
          viewport,
          '切换页签后的主图',
        )
      }

      await page.getByRole('button', { name: '模型说明', exact: true }).click()
      await expect(page.locator('.workspace-drawer')).toBeVisible()
      expectRectInside(await page.getByTestId('workspace-chart').boundingBox(), viewport, '打开说明后的主图')
      await page.getByRole('button', { name: '关闭展开面板' }).last().click()
      await expect(page.locator('.workspace-drawer')).toBeHidden()
      expectRectInside(await page.getByTestId('workspace-chart').boundingBox(), viewport, '关闭说明后的主图')
    })
  }
}

for (const viewport of mobileViewports) {
  for (const [name, route] of experimentRoutes) {
    test(`${name}在移动视口 ${viewport.width}x${viewport.height} 保持主图可见`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await waitForWorkspace(page, route)

      const initial = await measureWorkspace(page)
      expect(initial.documentScroll).toBeLessThanOrEqual(1)
      expect(initial.horizontalOverflow).toBeLessThanOrEqual(1)
      expectRectInside(initial.chart, initial.viewport, '移动端主图')
      expectRectInside(initial.controls, initial.viewport, '移动端参数面板')
      expect(initial.chart.height, '移动端主图不能被面板完全遮挡').toBeGreaterThanOrEqual(180)

      const sliders = page.getByTestId('workspace-controls').locator('input[type="range"]')
      const slider = sliders.last()
      await slider.scrollIntoViewIfNeeded()
      const chartBefore = await page.getByTestId('workspace-chart').boundingBox()
      await dragRangeWithChartVisible(page, slider)
      await page.waitForTimeout(160)
      const chartAfter = await page.getByTestId('workspace-chart').boundingBox()
      expectRectInside(chartAfter, viewport, '移动端调参后的主图')
      expect(Math.abs(chartAfter.y - chartBefore.y)).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => scrollY)).toBe(0)
    })
  }
}
