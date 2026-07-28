const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const range = (start, end, count) =>
  Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1))

const INDUSTRY_SCENARIOS = {
  信息技术: 1.45,
  金融业: 1.38,
  制造业: 1,
  建筑业: 0.92,
  批发零售: 0.84,
  住宿餐饮: 0.68,
  教育: 1.08,
  医疗: 1.15,
  交通运输: 1.02,
  农业: 0.62,
}

const REGION_SCENARIOS = {
  一线城市: 1.35,
  新一线城市: 1.1,
  二线城市: 0.85,
  三线及以下: 0.65,
}

function gini(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0)
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length
}

export function simulateWageDistribution(p = {}) {
  const industry = Object.keys(INDUSTRY_SCENARIOS)
    .find(key => String(p.industry || '').includes(key)) || '制造业'
  const region = Object.keys(REGION_SCENARIOS)
    .find(key => String(p.region || '').includes(key)) || '二线城市'
  const education = Number(p.edu_years ?? 16)
  const experience = Number(p.exp_years ?? 5)
  const base = Math.exp(7.5 + 0.085 * education + 0.05 * experience - 0.0006 * experience ** 2)
    * INDUSTRY_SCENARIOS[industry]
    * REGION_SCENARIOS[region]
  const values = Array.from({ length: 1000 }, (_, index) =>
    base * Math.exp(Math.sin(index * 12.9898) * 0.15))
  const sorted = [...values].sort((a, b) => a - b)
  const percentile = q => sorted[Math.floor((q / 100) * (sorted.length - 1))]
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const bins = range(percentile(2), percentile(98), 20)
  const frequencies = bins.map((bin, index) =>
    values.filter(value => value >= bin && value < (bins[index + 1] || Infinity)).length)

  return {
    statistics: {
      mean: round(mean),
      median: round(percentile(50)),
      std: round(Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)),
      min: round(sorted[0]),
      max: round(sorted.at(-1)),
      p90_p10_ratio: round(percentile(90) / percentile(10)),
      gini: round(gini(values), 4),
    },
    distribution: { bins: bins.map(value => round(value, 0)), frequencies },
    deciles: Array.from({ length: 10 }, (_, index) => ({
      percentile: (index + 1) * 10,
      value: round(percentile((index + 1) * 10)),
    })),
    model: {
      result_type: '1000个合成工资样本',
      assumptions: '教育回报、行业系数和地区系数均为教学情景参数，不是实证估计。',
    },
  }
}

export function simulateMincer(p = {}) {
  const education = Number(p.edu_years ?? 16)
  const experience = Number(p.exp_years ?? 5)
  const genderMultiplier = { male: 1.08, female: 0.89, all: 1 }
  const ownershipMultiplier = { state: 1.12, foreign: 1.18, private: 0.92, all: 1 }
  const genderEffect = Math.log(genderMultiplier[p.gender] || 1)
  const ownershipEffect = Math.log(ownershipMultiplier[p.ownership] || 1)
  const unionEffect = p.union_member ? Math.log(1.06) : 0
  const experienceContribution = 0.05 * experience - 0.0006 * experience ** 2
  const logWage = 7.5 + 0.085 * education + experienceContribution
    + genderEffect + ownershipEffect + unionEffect

  return {
    predicted_monthly_wage: round(Math.exp(logWage)),
    ln_wage: round(logWage, 4),
    decomposition: {
      base: 7.5,
      education_contribution: round(0.085 * education, 3),
      experience_contribution: round(experienceContribution, 3),
      gender_effect: round(genderEffect, 4),
      ownership_effect: round(ownershipEffect, 4),
      union_effect: round(unionEffect, 4),
    },
    model: {
      result_type: '工资经验方程教学情景',
      note: '明瑟方程主要属于第四章人力资本经验分析，本页仅保留交叉入口。',
    },
  }
}

export function simulateWageTheory(p = {}) {
  const mode = p.mode || 'efficiency'
  const referenceWage = Math.max(Number(p.reference_wage ?? 6000), 1)
  const wage = Math.max(Number(p.wage ?? 7200), 1)
  const effortSensitivity = clamp(Number(p.effort_sensitivity ?? 0.35), 0, 1)
  const risk = clamp(Number(p.risk ?? 35), 0, 100)
  const inconvenience = clamp(Number(p.inconvenience ?? 25), 0, 100)
  const performanceShare = clamp(Number(p.performance_share ?? 25), 0, 80)
  const targetCompletion = clamp(Number(p.target_completion ?? 90), 0, 150)

  if (mode === 'compensating') {
    const compensation = referenceWage * (risk * 0.0035 + inconvenience * 0.002)
    const requiredWage = referenceWage + compensation
    const riskGrid = range(0, 100, 11)
    return {
      mode,
      headline: '补偿性工资差异',
      metrics: {
        reference_wage: round(referenceWage),
        required_wage: round(requiredWage),
        compensation: round(compensation),
      },
      chart: {
        x: riskGrid.map(value => round(value, 0)),
        primary: riskGrid.map(value => round(referenceWage * (1 + value * 0.0035 + inconvenience * 0.002))),
        primary_name: '所需月薪',
      },
      explanation: '工作风险、夜班或不便利条件越高，其他条件相同时需要更高工资补偿劳动者承担的非工资成本。',
    }
  }

  if (mode === 'incentive') {
    const performancePay = wage * performanceShare / 100 * targetCompletion / 100
    const totalPay = wage + performancePay
    const shares = range(0, 60, 13)
    return {
      mode,
      headline: '激励工资与绩效工资',
      metrics: {
        fixed_wage: round(wage),
        performance_pay: round(performancePay),
        total_pay: round(totalPay),
      },
      chart: {
        x: shares.map(value => round(value, 0)),
        primary: shares.map(value => round(wage + wage * value / 100 * targetCompletion / 100)),
        primary_name: '总报酬',
      },
      explanation: '绩效工资把部分报酬与可观察产出挂钩，但过高的浮动比例也会把不可控风险转移给劳动者。',
    }
  }

  const wageGrid = range(referenceWage * 0.75, referenceWage * 1.65, 13)
  const effortIndex = value =>
    clamp(100 * (0.72 + effortSensitivity * Math.log(value / referenceWage + 0.45)), 45, 135)
  const turnoverRisk = value =>
    clamp(62 - 38 * Math.log(value / referenceWage + 0.4), 8, 80)
  return {
    mode: 'efficiency',
    headline: '效率工资',
    metrics: {
      wage: round(wage),
      effort_index: round(effortIndex(wage), 1),
      turnover_risk: round(turnoverRisk(wage), 1),
      wage_premium_pct: round((wage / referenceWage - 1) * 100, 1),
    },
    chart: {
      x: wageGrid.map(value => round(value, 0)),
      primary: wageGrid.map(value => round(effortIndex(value), 1)),
      secondary: wageGrid.map(value => round(turnoverRisk(value), 1)),
      primary_name: '努力/生产率指数',
      secondary_name: '流失风险',
    },
    explanation: '高于市场参照的工资可能通过降低流失、提高努力和吸引更匹配的劳动者来提升效率，但效果取决于劳动过程和监督条件。',
  }
}
