import ExcelJS from 'exceljs'

const SHEETS = Object.freeze({
  info: { name: '00_使用说明', index: 1 },
  v1: { name: '02_V1分类', index: 3 },
  v1Metrics: { name: '03_V1指标', index: 4 },
  audit: { name: __ANONYMOUS_BUILD__ ? '' : '04_LMDT与AI审计', index: 5 },
  v2: { name: '05_V2分类', index: 6 },
  v2Metrics: { name: '06_V2指标图表', index: 7 },
  report: { name: '07_汇报提交', index: 8 },
})

const METRIC_ROWS = Object.freeze({
  W: 6,
  E: 7,
  U: 8,
  N: 9,
  LF: 10,
  participationRate: 11,
  employmentPopulationRatio: 12,
  unemploymentRate: 13,
  identity: 14,
})

function sheet(workbook, descriptor) {
  return workbook.getWorksheet(descriptor.name) || workbook.worksheets[descriptor.index - 1]
}

function scalar(value) {
  if (value == null) return ''
  if (typeof value !== 'object') return value
  if ('result' in value) return value.result ?? ''
  if (Array.isArray(value.richText)) return value.richText.map(item => item.text).join('')
  if ('text' in value) return value.text ?? ''
  return ''
}

function text(cell) {
  return String(scalar(cell?.value)).trim()
}

function number(cell) {
  const value = Number(scalar(cell?.value))
  return Number.isFinite(value) ? value : null
}

function boolean(cell) {
  const value = text(cell).toLowerCase()
  if (['是', 'true', 'yes', '1'].includes(value)) return true
  if (['否', 'false', 'no', '0', '不适用', '无', ''].includes(value)) return false
  return null
}

function formula(cell) {
  const value = cell?.value
  if (!value || typeof value !== 'object' || !('formula' in value)) return ''
  const formulaText = String(value.formula || '').trim()
  return formulaText ? `=${formulaText.replace(/^=/, '')}` : ''
}

function readMetrics(metricsSheet) {
  return Object.fromEntries(Object.entries(METRIC_ROWS).map(([key, row]) => {
    const cell = metricsSheet.getCell(`B${row}`)
    return [key, { value: number(cell), formula: formula(cell) }]
  }))
}

function readPeople(v1Sheet, v2Sheet, phase) {
  return Array.from({ length: 36 }, (_, index) => {
    const row = index + 6
    const phaseSheet = phase === 'v2' ? v2Sheet : v1Sheet
    return {
      personId: text(v1Sheet.getCell(`A${row}`)),
      name: text(v1Sheet.getCell(`B${row}`)),
      age: number(v1Sheet.getCell(`C${row}`)),
      identity: text(v1Sheet.getCell(`D${row}`)),
      paidHours: number(v1Sheet.getCell(`E${row}`)),
      temporarilyAbsent: boolean(v1Sheet.getCell(`F${row}`)),
      absenceEvidence: text(v1Sheet.getCell(`G${row}`)),
      activeSearch3m: boolean(v1Sheet.getCell(`H${row}`)),
      searchEvidence: text(v1Sheet.getCell(`I${row}`)),
      available2w: boolean(v1Sheet.getCell(`J${row}`)),
      otherFacts: text(v1Sheet.getCell(`K${row}`)),
      category: text(phaseSheet.getCell(`${phase === 'v2' ? 'E' : 'L'}${row}`)).toUpperCase(),
      hitRule: text(phaseSheet.getCell(`${phase === 'v2' ? 'G' : 'M'}${row}`)).toUpperCase(),
      rationale: phase === 'v2'
        ? text(phaseSheet.getCell(`H${row}`))
        : text(phaseSheet.getCell(`N${row}`)),
      changeReason: phase === 'v2' ? text(phaseSheet.getCell(`H${row}`)) : '',
      v1Category: text(v1Sheet.getCell(`L${row}`)).toUpperCase(),
    }
  })
}

function readAiAudit(auditSheet) {
  const records = Array.from({ length: 36 }, (_, index) => {
    const row = index + 14
    return {
      target: text(auditSheet.getCell(`A${row}`)),
      feedbackCode: text(auditSheet.getCell(`B${row}`)),
      systemFeedback: text(auditSheet.getCell(`C${row}`)),
      originalText: text(auditSheet.getCell(`D${row}`)),
      judgment: text(auditSheet.getCell(`E${row}`)),
      basis: text(auditSheet.getCell(`F${row}`)),
      intendedChange: text(auditSheet.getCell(`G${row}`)),
      finalAction: text(auditSheet.getCell(`H${row}`)),
    }
  }).filter(record => Object.values(record).some(Boolean))

  const tool = text(auditSheet.getCell('B53'))
  return {
    used: Boolean(tool) && !['未使用', '无', '否'].includes(tool),
    tool,
    prompt: text(auditSheet.getCell('B54')),
    originalText: records.map(record => record.originalText).filter(Boolean).join('\n'),
    records,
  }
}

function readReport(reportSheet) {
  return {
    factualConclusion: text(reportSheet.getCell('B15')),
    keyNumbers: text(reportSheet.getCell('B16')),
    cautiousExplanation: text(reportSheet.getCell('B17')),
    prohibitedInference: text(reportSheet.getCell('B18')),
    nextEvidence: text(reportSheet.getCell('B19')),
    aiDisclosure: text(reportSheet.getCell('B20')),
  }
}

export async function parsePracticeWorkbook(input, { phase = 'v1' } = {}) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(input)

  const infoSheet = sheet(workbook, SHEETS.info)
  const v1Sheet = sheet(workbook, SHEETS.v1)
  const v2Sheet = sheet(workbook, SHEETS.v2)
  const metricsSheet = sheet(workbook, phase === 'v2' ? SHEETS.v2Metrics : SHEETS.v1Metrics)
  const auditSheet = sheet(workbook, SHEETS.audit)
  const reportSheet = sheet(workbook, SHEETS.report)

  return {
    versions: {
      template: text(infoSheet.getCell('B7')),
      dataset: text(infoSheet.getCell('B8')),
      rules: text(infoSheet.getCell('B9')),
    },
    student: {
      className: text(infoSheet.getCell('B4')),
      id: text(infoSheet.getCell('B5')),
      name: text(infoSheet.getCell('B6')),
    },
    people: readPeople(v1Sheet, v2Sheet, phase),
    metrics: readMetrics(metricsSheet),
    aiAudit: readAiAudit(auditSheet),
    report: readReport(reportSheet),
  }
}
