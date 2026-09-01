import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { auditPracticeSubmission } from './audit'
import { parsePracticeWorkbook } from './workbookAdapter'

const templatePath = resolve('public/templates/实践一_劳动力市场指标诊断_学生Excel模板_V1.0.xlsx')

function yes(cell) {
  return String(cell.text || cell.value || '').trim() === '是'
}

function expectedForRow(sheet, row) {
  const paidHours = Number(sheet.getCell(`E${row}`).result ?? sheet.getCell(`E${row}`).value ?? 0)
  if (paidHours >= 1) return { category: 'E', rule: 'R-E01' }
  if (yes(sheet.getCell(`F${row}`))) return { category: 'E', rule: 'R-E02' }
  if (yes(sheet.getCell(`H${row}`)) && yes(sheet.getCell(`J${row}`))) return { category: 'U', rule: 'R-U01' }
  if (yes(sheet.getCell(`H${row}`))) return { category: 'N', rule: 'R-N02' }
  return { category: 'N', rule: 'R-N01' }
}

function writeMetric(cell, formula, result) {
  cell.value = { formula, result }
}

function fillMetrics(sheet, categoryColumn) {
  const categories = Array.from({ length: 36 }, (_, index) => sheet.workbook
    .getWorksheet(categoryColumn === 'L' ? '02_V1分类' : '05_V2分类')
    .getCell(`${categoryColumn}${index + 6}`).text.trim())
  const W = categories.length
  const E = categories.filter(value => value === 'E').length
  const U = categories.filter(value => value === 'U').length
  const N = categories.filter(value => value === 'N').length
  const LF = E + U
  writeMetric(sheet.getCell('B6'), '=COUNTA(A6:A41)', W)
  writeMetric(sheet.getCell('B7'), `=COUNTIF(${categoryColumn}6:${categoryColumn}41,"E")`, E)
  writeMetric(sheet.getCell('B8'), `=COUNTIF(${categoryColumn}6:${categoryColumn}41,"U")`, U)
  writeMetric(sheet.getCell('B9'), `=COUNTIF(${categoryColumn}6:${categoryColumn}41,"N")`, N)
  writeMetric(sheet.getCell('B10'), '=B7+B8', LF)
  writeMetric(sheet.getCell('B11'), '=B10/B6', LF / W)
  writeMetric(sheet.getCell('B12'), '=B7/B6', E / W)
  writeMetric(sheet.getCell('B13'), '=B8/B10', U / LF)
  writeMetric(sheet.getCell('B14'), '=B7+B8+B9', E + U + N)
}

async function makeWorkbook(phase, mutate) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(readFileSync(templatePath))
  const info = workbook.getWorksheet('00_使用说明')
  const v1 = workbook.getWorksheet('02_V1分类')
  const v2 = workbook.getWorksheet('05_V2分类')
  const audit = workbook.getWorksheet('04_LMDT与AI审计')
  const report = workbook.getWorksheet('07_汇报提交')

  info.getCell('B4').value = '人力01'
  info.getCell('B5').value = '001'
  info.getCell('B6').value = '测试学生'

  for (let row = 6; row <= 41; row += 1) {
    const expected = expectedForRow(v1, row)
    v1.getCell(`L${row}`).value = expected.category
    v1.getCell(`M${row}`).value = expected.rule
    v1.getCell(`N${row}`).value = '依据本周工作、近3个月实际求职和未来2周可到岗事实判断。'
    v2.getCell(`E${row}`).value = expected.category
    v2.getCell(`G${row}`).value = expected.rule
    v2.getCell(`H${row}`).value = '复核人物事实和规则后，保留该分类与命中规则。'
  }

  fillMetrics(workbook.getWorksheet('03_V1指标'), 'L')
  fillMetrics(workbook.getWorksheet('06_V2指标图表'), 'E')

  audit.getCell('B53').value = '未使用'
  report.getCell('B15').value = '本次单期教学样本呈现就业、失业和非劳动力三类结构。'
  report.getCell('B17').value = '这些数字只反映本次单期教学样本，不能代表真实城市。'
  report.getCell('B18').value = '不能推出趋势、因果、政策效果或就业质量。'
  report.getCell('B19').value = '下一步需要补充多期真实抽样数据。'

  await mutate?.(workbook)
  return workbook.xlsx.writeBuffer()
}

async function runWorkbook(phase, mutate) {
  const buffer = await makeWorkbook(phase, mutate)
  const submission = await parsePracticeWorkbook(buffer, { phase })
  return auditPracticeSubmission(submission, { phase })
}

describe('多份故意错误 V1/V2 的真实 Excel 回归', () => {
  it('V1-错误版本.xlsx → REJECTED / FILE_VERSION_ERROR', async () => {
    const result = await runWorkbook('v1', workbook => {
      workbook.getWorksheet('00_使用说明').getCell('B7').value = 'TPL-L02-STUDENT-OLD'
    })
    expect(result.status).toBe('REJECTED')
    expect(result.findings[0].code).toBe('FILE_VERSION_ERROR')
  })

  it('V1-漏填P08.xlsx → NEED_INFO / MISSING_REQUIRED', async () => {
    const result = await runWorkbook('v1', workbook => {
      workbook.getWorksheet('02_V1分类').getCell('L13').value = ''
    })
    expect(result.status).toBe('NEED_INFO')
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'MISSING_REQUIRED', target: 'P08' })]))
  })

  it('V1-P24误判.xlsx → V1_NEEDS_REVISION / CLASS_MISMATCH', async () => {
    const result = await runWorkbook('v1', workbook => {
      workbook.getWorksheet('02_V1分类').getCell('L29').value = 'N'
      fillMetrics(workbook.getWorksheet('03_V1指标'), 'L')
    })
    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CLASS_MISMATCH', target: 'P24' })]))
  })

  it('V1-失业率硬编码.xlsx → FORMULA_NOT_AUDITABLE', async () => {
    const result = await runWorkbook('v1', workbook => {
      workbook.getWorksheet('03_V1指标').getCell('B13').value = 4 / 27
    })
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'FORMULA_NOT_AUDITABLE', target: '失业率' })]))
  })

  it('V1-参与率错分母.xlsx → RATE_MISMATCH', async () => {
    const result = await runWorkbook('v1', workbook => {
      writeMetric(workbook.getWorksheet('03_V1指标').getCell('B11'), '=B7/B6', 23 / 36)
    })
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'RATE_MISMATCH', target: '劳动参与率' })]))
  })

  it('V2-P24再次误判.xlsx → V1_NEEDS_REVISION / CLASS_MISMATCH', async () => {
    const result = await runWorkbook('v2', workbook => {
      workbook.getWorksheet('05_V2分类').getCell('E29').value = 'N'
      fillMetrics(workbook.getWorksheet('06_V2指标图表'), 'E')
    })
    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CLASS_MISMATCH', target: 'P24' })]))
  })

  it('V2-P12无修改理由.xlsx → TEACHER_REVIEW / CHANGE_REASON_MISSING', async () => {
    const result = await runWorkbook('v2', workbook => {
      workbook.getWorksheet('05_V2分类').getCell('H17').value = ''
    })
    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CHANGE_REASON_MISSING', target: 'P12' })]))
  })

  it('V2-AI无原回答.xlsx → TEACHER_REVIEW / AI_TRACE_MISSING', async () => {
    const result = await runWorkbook('v2', workbook => {
      const audit = workbook.getWorksheet('04_LMDT与AI审计')
      audit.getCell('B53').value = '某AI工具'
      audit.getCell('B54').value = '请审核分类'
    })
    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'AI_TRACE_MISSING' })]))
  })

  it('V2-单期写趋势.xlsx → TEACHER_REVIEW / REPORT_BOUNDARY_RISK', async () => {
    const result = await runWorkbook('v2', workbook => {
      const report = workbook.getWorksheet('07_汇报提交')
      report.getCell('B15').value = '就业率明显上升。'
      report.getCell('B17').value = '政策导致了就业改善。'
    })
    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'REPORT_BOUNDARY_RISK' })]))
  })

  it('V2-完整正确.xlsx → AUDIT_READY', async () => {
    const result = await runWorkbook('v2')
    expect(result.status).toBe('AUDIT_READY')
    expect(result.findings).toEqual([])
  })
})
