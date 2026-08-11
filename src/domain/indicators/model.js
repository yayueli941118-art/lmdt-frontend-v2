const NUMERIC_FIELDS = [
  'working_age_population', 'labor_force', 'employed', 'unemployed', 'vacancies',
  'average_wage', 'median_wage', 'wage_p10', 'wage_p25', 'wage_p75', 'wage_p90',
  'output', 'hours_worked', 'youth_labor_force', 'youth_employed', 'youth_unemployed',
]

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null
const rate = (numerator, denominator) => denominator > 0 && Number.isFinite(numerator)
  ? round(numerator / denominator * 100)
  : null
const changeRate = (current, previous) => previous !== null && previous !== 0 && current !== null
  ? round((current - previous) / Math.abs(previous) * 100)
  : null

function numeric(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

export const indicatorMeta = {
  participation_rate: {
    label: '劳动参与率', formula: '劳动力人口 ÷ 劳动年龄人口 × 100%',
    numerator: '劳动力人口', denominator: '劳动年龄人口', unit: '%',
    conclusion: '反映劳动年龄人口进入劳动力市场的程度。',
    boundary: '不能单独判断就业质量，也不能把未参与者全部视为失业者。',
  },
  employment_population_ratio: {
    label: '就业人口比', formula: '就业人口 ÷ 劳动年龄人口 × 100%',
    numerator: '就业人口', denominator: '劳动年龄人口', unit: '%',
    conclusion: '反映劳动年龄人口中实际就业者的比例。',
    boundary: '不能说明工时、工资、合同稳定性和就业质量。',
  },
  unemployment_rate: {
    label: '失业率', formula: '失业人口 ÷ 劳动力人口 × 100%',
    numerator: '失业人口', denominator: '劳动力人口', unit: '%',
    conclusion: '反映进入劳动力市场的人群中未就业且在求职者的比例。',
    boundary: '分母不含非劳动力，不能直接代表全部劳动年龄人口的无工作比例。',
  },
  vacancy_rate: {
    label: '职位空缺率', formula: '职位空缺数 ÷（就业人口＋职位空缺数）× 100%',
    numerator: '职位空缺数', denominator: '就业人口＋职位空缺数', unit: '%',
    conclusion: '用于观察雇主未满足的用工需求强度。',
    boundary: '招聘广告样本不等于全社会职位空缺总量，口径不一致时不可比较。',
  },
  employment_growth_rate: {
    label: '就业增长率', formula: '（本期就业－上期就业）÷ 上期就业 × 100%',
    numerator: '本期与上期就业差额', denominator: '上期就业人口', unit: '%',
    conclusion: '描述相邻期间就业规模的变化。', boundary: '不能自动解释增长原因或就业质量。',
  },
  demand_growth_rate: {
    label: '岗位需求增长率', formula: '（本期空缺－上期空缺）÷ 上期空缺 × 100%',
    numerator: '本期与上期空缺差额', denominator: '上期职位空缺数', unit: '%',
    conclusion: '描述同口径职位空缺的变化。', boundary: '不能将招聘样本增长直接外推为社会岗位总量增长。',
  },
  wage_growth_rate: {
    label: '平均工资增长率', formula: '（本期平均工资－上期平均工资）÷ 上期平均工资 × 100%',
    numerator: '本期与上期平均工资差额', denominator: '上期平均工资', unit: '%',
    conclusion: '描述同口径名义平均工资变化。', boundary: '未扣除物价时不是实际工资增长，也可能受人员结构变化影响。',
  },
  mean_median_gap_pct: {
    label: '平均—中位工资差异', formula: '（平均工资－中位工资）÷ 中位工资 × 100%',
    numerator: '平均工资与中位工资差额', denominator: '中位工资', unit: '%',
    conclusion: '较大的正差异提示高工资值可能拉高平均数。', boundary: '不能替代完整分位数或收入分配分析。',
  },
  structure_share: {
    label: '就业结构占比', formula: '本组就业人口 ÷ 同期全部组就业人口 × 100%',
    numerator: '本组就业人口', denominator: '同期全部组就业人口', unit: '%',
    conclusion: '用于比较行业、地区或职业在同期就业中的结构位置。', boundary: '取决于导入数据覆盖范围，不代表未被样本覆盖的总体。',
  },
  unit_labor_cost: {
    label: '基础单位劳动成本', formula: '平均工资 × 就业人口 ÷ 产出',
    numerator: '工资总额近似值', denominator: '产出', unit: '工资口径/产出单位',
    conclusion: '在字段与单位一致时近似观察单位产出的劳动成本。', boundary: '缺少工时、福利或一致产出口径时只能作为教学近似。',
  },
}

export function normalizeTimeSeries(rows = []) {
  return rows.map((row, index) => {
    const normalized = { ...row, __row: index + 2, period: String(row.period ?? '').trim() }
    NUMERIC_FIELDS.forEach(field => { normalized[field] = numeric(row[field]) })
    return normalized
  })
}

export function validateTimeSeries(inputRows = []) {
  const rows = normalizeTimeSeries(inputRows)
  const errors = []
  const warnings = []
  const seen = new Map()
  const order = []
  const add = (bucket, code, row, message, field = '') => bucket.push({ code, row, field, message })

  if (!rows.length) add(errors, 'NO_DATA', 0, '没有可分析的数据。')
  rows.forEach(row => {
    if (!row.period) add(errors, 'MISSING_PERIOD', row.__row, 'period 不能为空。', 'period')
    const dimensionKey = [row.period, row.region || '', row.industry || '', row.occupation || ''].join('|')
    if (seen.has(dimensionKey)) add(errors, 'DUPLICATE_PERIOD', row.__row, `与第 ${seen.get(dimensionKey)} 行的期间和维度重复。`, 'period')
    else seen.set(dimensionKey, row.__row)
    order.push(row.period)

    NUMERIC_FIELDS.forEach(field => {
      if (row[field] === null && field in inputRows[row.__row - 2]) {
        add(warnings, 'MISSING_VALUE', row.__row, `${field} 缺失或不是有效数字，系统不会自动填补。`, field)
      }
      if (row[field] !== null && row[field] < 0) add(errors, 'NEGATIVE_VALUE', row.__row, `${field} 不得为负值。`, field)
    })
    if (row.working_age_population === 0 || row.labor_force === 0) {
      add(errors, 'ZERO_DENOMINATOR', row.__row, '劳动年龄人口或劳动力人口为 0，关键比率无法计算。')
    }
    if (row.labor_force !== null && row.employed !== null && row.unemployed !== null) {
      const difference = Math.abs(row.employed + row.unemployed - row.labor_force)
      if (difference > Math.max(1, row.labor_force * 0.01)) {
        add(errors, 'LABOR_FORCE_MISMATCH', row.__row, 'employed + unemployed 与 labor_force 不一致。')
      }
    }
    if (row.average_wage && row.median_wage) {
      const gap = Math.abs(row.average_wage / row.median_wage - 1)
      if (gap > 0.25) add(warnings, 'MEAN_MEDIAN_GAP', row.__row, '平均工资与中位工资差异较大，应检查分布与异常值。')
    }
  })
  if (order.some((period, index) => index > 0 && period < order[index - 1])) {
    add(warnings, 'TIME_ORDER', 0, '期间未按升序排列；分析时会重新排序，但原始数据不会被改写。')
  }
  const wages = rows.flatMap(row => [row.average_wage, row.median_wage]).filter(value => value > 0)
  if (wages.length > 1 && Math.max(...wages) / Math.min(...wages) > 100) {
    add(warnings, 'POSSIBLE_UNIT_MIX', 0, '工资数值跨度超过 100 倍，可能混用了元、千元或万元。')
  }
  const grade = errors.length ? 'D' : warnings.length >= 4 ? 'C' : warnings.length ? 'B' : 'A'
  return { rows, errors, warnings, grade, canAnalyze: rows.length > 0 && errors.length === 0 }
}

function dimensionKey(row) {
  return [row.region || '', row.industry || '', row.occupation || ''].join('|')
}

export function calculateIndicators(inputRows = []) {
  const rows = normalizeTimeSeries(inputRows).sort((a, b) => a.period.localeCompare(b.period))
  const previousByDimension = new Map()
  const employedTotals = new Map()
  rows.forEach(row => employedTotals.set(row.period, (employedTotals.get(row.period) || 0) + (row.employed || 0)))
  const series = rows.map(row => {
    const key = dimensionKey(row)
    const previous = previousByDimension.get(key)
    const current = {
      ...row,
      participation_rate: rate(row.labor_force, row.working_age_population),
      employment_population_ratio: rate(row.employed, row.working_age_population),
      unemployment_rate: rate(row.unemployed, row.labor_force),
      vacancy_rate: rate(row.vacancies, (row.employed || 0) + (row.vacancies || 0)),
      employment_growth_rate: changeRate(row.employed, previous?.employed ?? null),
      demand_growth_rate: changeRate(row.vacancies, previous?.vacancies ?? null),
      wage_growth_rate: changeRate(row.average_wage, previous?.average_wage ?? null),
      mean_median_gap_pct: row.average_wage !== null && row.median_wage
        ? round((row.average_wage - row.median_wage) / row.median_wage * 100)
        : null,
      structure_share: rate(row.employed, employedTotals.get(row.period)),
      unit_labor_cost: row.output > 0 && row.average_wage !== null && row.employed !== null
        ? round(row.average_wage * row.employed / row.output)
        : null,
      youth_unemployment_rate: rate(row.youth_unemployed, row.youth_labor_force),
    }
    previousByDimension.set(key, row)
    return current
  })
  return { series, meta: indicatorMeta }
}
