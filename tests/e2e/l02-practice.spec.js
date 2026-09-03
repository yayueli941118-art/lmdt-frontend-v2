import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const templatePath = resolve('public/templates/实践一_劳动力市场指标诊断_学生Excel模板_V1.0.xlsx')

test('首页和专用路由提供实践一工作台入口', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByRole('link', { name: '进入实践一工作台' }).first()).toBeVisible()
  await page.getByRole('link', { name: '进入实践一工作台' }).first().click()
  await expect(page.getByRole('heading', { name: '劳动力市场指标诊断' })).toBeVisible()
  await expect(page.getByText('V1 → LMDT → AI审计 → V2')).toBeVisible()
  await expect(page.getByRole('link', { name: '下载学生Excel模板' })).toHaveAttribute('href', /实践一_劳动力市场指标诊断_学生Excel模板_V1\.0\.xlsx/)
})

test('真实Excel上传后显示稳定反馈，且被拒绝的V1不能绕过到V2', async ({ page }) => {
  await page.goto('/#/practice/labor-market-indicators')
  await expect(page.getByTestId('v2-upload')).toBeDisabled()

  await page.getByTestId('v1-upload').setInputFiles(templatePath)

  const report = page.getByTestId('v1-audit-report')
  await expect(report).toHaveAttribute('data-status', 'REJECTED')
  await expect(report).toContainText('MISSING_STUDENT_INFO')
  await expect(report).toContainText('系统只显示人物ID、反馈码和修订路径')
  await expect(page.getByTestId('v2-upload')).toBeDisabled()
})
