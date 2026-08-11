import { analyzeOccupationTasks, occupationTemplates } from '../aiImpact/model'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round = (value, digits = 2) => Number(value.toFixed(digits))

function rhoFromSigma(sigma) {
  return (sigma - 1) / sigma
}

export function cesOutput({ labor, capital, sigma = 1, productivity = 65, capitalShare = 0.6 }) {
  const L = Math.max(Number(labor), 1e-8)
  const K = Math.max(Number(capital), 1e-8)
  const rho = rhoFromSigma(sigma)
  if (Math.abs(rho) < 1e-7) {
    return productivity * (K ** capitalShare) * (L ** (1 - capitalShare))
  }
  const aggregate = capitalShare * (K ** rho) + (1 - capitalShare) * (L ** rho)
  return productivity * (aggregate ** (1 / rho))
}

export function cesMarginalProducts({ labor, capital, sigma = 1, productivity = 65, capitalShare = 0.6 }) {
  const L = Math.max(Number(labor), 1e-8)
  const K = Math.max(Number(capital), 1e-8)
  const rho = rhoFromSigma(sigma)
  if (Math.abs(rho) < 1e-7) {
    return {
      mpl: productivity * (1 - capitalShare) * (K ** capitalShare) * (L ** (-capitalShare)),
      mpk: productivity * capitalShare * (L ** (1 - capitalShare)) * (K ** (capitalShare - 1)),
    }
  }
  const aggregate = Math.max(
    capitalShare * (K ** rho) + (1 - capitalShare) * (L ** rho),
    1e-12,
  )
  return {
    mpl: productivity * (1 - capitalShare) * (L ** (rho - 1)) * (aggregate ** (1 / rho - 1)),
    mpk: productivity * capitalShare * (K ** (rho - 1)) * (aggregate ** (1 / rho - 1)),
  }
}

export function costMinBundle({
  output,
  wage,
  rentalRate,
  sigma = 1,
  productivity = 65,
  capitalShare = 0.6,
}) {
  const rho = rhoFromSigma(sigma)
  const exponent = 1 / (rho - 1)
  const laborCapitalRatio = (
    (wage / rentalRate) * (capitalShare / (1 - capitalShare))
  ) ** exponent
  const unitOutput = cesOutput({
    labor: laborCapitalRatio,
    capital: 1,
    sigma,
    productivity,
    capitalShare,
  })
  const scale = output / Math.max(unitOutput, 1e-8)
  const labor = laborCapitalRatio * scale
  const capital = scale
  return {
    labor,
    capital,
    cost: wage * labor + rentalRate * capital,
    unit_cost: (wage * labor + rentalRate * capital) / Math.max(output, 1e-8),
  }
}

function nearestLaborForWage({ wage, laborGrid, vmp }) {
  return laborGrid.reduce((best, labor, index) =>
    Math.abs(vmp[index] - wage) < Math.abs(vmp[best.index] - wage)
      ? { labor, index }
      : best,
  { labor: laborGrid[0], index: 0 })
}

function isoquant({ output, sigma, productivity, capitalShare }) {
  const labor = Array.from({ length: 80 }, (_, index) => 20 + index * 8)
  const capital = labor.map(value => {
    let low = 0.01
    let high = 6000
    for (let index = 0; index < 70; index += 1) {
      const mid = (low + high) / 2
      const current = cesOutput({
        labor: value,
        capital: mid,
        sigma,
        productivity,
        capitalShare,
      })
      if (current < output) low = mid
      else high = mid
    }
    return (low + high) / 2
  })
  return { labor, capital: capital.map(value => round(value)) }
}

export function simulateDemand(input = {}) {
  const wageInitial = Number(input.wage_initial ?? 55)
  const wageNew = Number(input.wage_new ?? 42)
  const productPrice = Number(input.product_price ?? 1)
  const fixedCapital = Number(input.capital ?? 700)
  const sigma = clamp(Number(input.sigma ?? 1.2), 0.3, 3)
  const demandElasticity = clamp(Number(input.product_demand_elasticity ?? 0.8), 0.1, 2.5)
  const capitalFlexibility = clamp(Number(input.capital_flexibility ?? 0.55), 0, 1)
  const laborCostShare = clamp(Number(input.labor_cost_share ?? 0.35), 0.05, 0.9)
  const marketFeedback = clamp(Number(input.market_feedback ?? 0.65), 0, 1)
  const technologyType = String(input.tech_type || '中性技术')
  const technologyFactor = technologyType.includes('替代')
    ? 0.9
    : technologyType.includes('互补')
      ? 1.12
      : 1
  const productivity = 65 * technologyFactor
  const capitalShare = 0.6
  const laborGrid = Array.from({ length: 121 }, (_, index) => 20 + index * 5)
  const vmpAtPrice = price => laborGrid.map(labor =>
    price * cesMarginalProducts({
      labor,
      capital: fixedCapital,
      sigma,
      productivity,
      capitalShare,
    }).mpl)
  const shortVmp = vmpAtPrice(productPrice)
  const initialMatch = nearestLaborForWage({ wage: wageInitial, laborGrid, vmp: shortVmp })
  const shortMatch = nearestLaborForWage({ wage: wageNew, laborGrid, vmp: shortVmp })
  const outputInitial = cesOutput({
    labor: initialMatch.labor,
    capital: fixedCapital,
    sigma,
    productivity,
    capitalShare,
  })
  const initialMarginals = cesMarginalProducts({
    labor: initialMatch.labor,
    capital: fixedCapital,
    sigma,
    productivity,
    capitalShare,
  })
  const rentalRate = Math.max(
    wageInitial * initialMarginals.mpk / Math.max(initialMarginals.mpl, 1e-8),
    0.1,
  )
  const baselineBundle = costMinBundle({
    output: outputInitial,
    wage: wageInitial,
    rentalRate,
    sigma,
    productivity,
    capitalShare,
  })
  const substitutionBundleFull = costMinBundle({
    output: outputInitial,
    wage: wageNew,
    rentalRate,
    sigma,
    productivity,
    capitalShare,
  })
  const adjustmentWeight = capitalFlexibility
  const substitutionBundle = {
    labor: initialMatch.labor + (substitutionBundleFull.labor - initialMatch.labor) * adjustmentWeight,
    capital: fixedCapital + (substitutionBundleFull.capital - fixedCapital) * adjustmentWeight,
  }
  const newUnit = costMinBundle({
    output: 1,
    wage: wageNew,
    rentalRate,
    sigma,
    productivity,
    capitalShare,
  }).cost
  const initialUnit = costMinBundle({
    output: 1,
    wage: wageInitial,
    rentalRate,
    sigma,
    productivity,
    capitalShare,
  }).cost
  const outputNew = outputInitial * (
    newUnit / Math.max(initialUnit, 1e-8)
  ) ** (-demandElasticity * laborCostShare)
  const scaleBundleFull = costMinBundle({
    output: outputNew,
    wage: wageNew,
    rentalRate,
    sigma,
    productivity,
    capitalShare,
  })
  const longBundle = {
    labor: substitutionBundle.labor + (scaleBundleFull.labor - substitutionBundleFull.labor) * adjustmentWeight,
    capital: substitutionBundle.capital + (scaleBundleFull.capital - substitutionBundleFull.capital) * adjustmentWeight,
  }
  const marketExpansion = (
    shortMatch.labor - initialMatch.labor
  ) / Math.max(initialMatch.labor, 1)
  const adjustedPrice = clamp(
    productPrice * (1 - marketFeedback * demandElasticity * marketExpansion * 0.22),
    productPrice * 0.55,
    productPrice * 1.4,
  )
  const marketVmp = vmpAtPrice(adjustedPrice)
  const marketMatch = nearestLaborForWage({ wage: wageNew, laborGrid, vmp: marketVmp })
  const substitutionEffect = substitutionBundle.labor - initialMatch.labor
  const scaleEffect = longBundle.labor - substitutionBundle.labor
  const totalEffect = longBundle.labor - initialMatch.labor
  const wageChangeRate = Math.abs((wageNew - wageInitial) / Math.max(wageInitial, 1))
  const shortElasticity = wageChangeRate > 1e-6
    ? Math.abs((shortMatch.labor - initialMatch.labor) / initialMatch.labor / wageChangeRate)
    : sigma * 0.4
  const longElasticity = wageChangeRate > 1e-6
    ? Math.abs(totalEffect / initialMatch.labor / wageChangeRate)
    : shortElasticity + demandElasticity * laborCostShare
  const curveWages = Array.from({ length: 66 }, (_, index) => 20 + index * 2)
  const shortCurve = curveWages.map(wage =>
    nearestLaborForWage({ wage, laborGrid, vmp: shortVmp }).labor)
  const longCurve = curveWages.map(wage => {
    const unit = costMinBundle({
      output: 1,
      wage,
      rentalRate,
      sigma,
      productivity,
      capitalShare,
    }).cost
    const q = outputInitial * (
      unit / Math.max(initialUnit, 1e-8)
    ) ** (-demandElasticity * laborCostShare)
    return costMinBundle({
      output: q,
      wage,
      rentalRate,
      sigma,
      productivity,
      capitalShare,
    }).labor
  })
  const elasticityLabel = longElasticity >= 1
    ? '弹性较大'
    : longElasticity >= 0.55
      ? '中等弹性'
      : '弹性较小'
  return {
    model: {
      name: 'CES 生产与派生劳动需求',
      formula: 'Q=A[αK^ρ+(1-α)L^ρ]^(1/ρ)，VMP=P×MPL，VMP=W',
      result_type: '教材机制模拟',
    },
    short_run: {
      labor_grid: laborGrid,
      vmp: shortVmp.map(value => round(value)),
      wage_initial: wageInitial,
      wage_new: wageNew,
      point_a: { label: 'A', wage: wageInitial, labor: round(initialMatch.labor), vmp: round(shortVmp[initialMatch.index]) },
      point_b: { label: 'B', wage: wageNew, labor: round(shortMatch.labor), vmp: round(shortVmp[shortMatch.index]) },
      rule: '完全竞争、产品价格给定且资本短期固定时，企业按 P×MPL=W 选择劳动数量。',
    },
    market: {
      price_initial: round(productPrice),
      price_after: round(adjustedPrice),
      vmp_initial: shortVmp.map(value => round(value)),
      vmp_adjusted: marketVmp.map(value => round(value)),
      point_b: { label: 'B', wage: wageNew, labor: round(shortMatch.labor) },
      point_i: { label: 'I', wage: wageNew, labor: round(marketMatch.labor) },
      explanation: marketExpansion >= 0
        ? '工资下降使单个企业扩大用工；全市场同步扩产会压低产品价格，使 VMP 曲线下移。'
        : '工资上升使企业收缩用工；全市场同步减产可能抬高产品价格，使 VMP 曲线部分回移。',
    },
    long_run: {
      point_a: { label: 'A', wage: wageInitial, labor: round(initialMatch.labor), capital: round(fixedCapital) },
      point_b: { label: 'B', wage: wageNew, labor: round(substitutionBundle.labor), capital: round(substitutionBundle.capital) },
      point_c: { label: 'C', wage: wageNew, labor: round(longBundle.labor), capital: round(longBundle.capital) },
      substitution_effect: round(substitutionEffect),
      scale_effect: round(scaleEffect),
      total_effect: round(totalEffect),
      output_initial: round(outputInitial),
      output_new: round(outputNew),
      isoquants: {
        initial: isoquant({ output: outputInitial, sigma, productivity, capitalShare }),
        new: isoquant({ output: outputNew, sigma, productivity, capitalShare }),
      },
      short_curve: { wages: curveWages, labor: shortCurve.map(value => round(value)) },
      long_curve: { wages: curveWages, labor: longCurve.map(value => round(value)) },
      explanation: 'B 点保持原产量，只反映相对要素价格变化；C 点再允许产量变化，因此 A→C 等于替代效应与规模效应之和。',
    },
    elasticity: {
      short: round(shortElasticity, 2),
      long: round(longElasticity, 2),
      label: elasticityLabel,
      factors: [
        { name: '要素替代性', value: round((sigma / 3) * 100), desc: '替代弹性越大，长期劳动需求越敏感。' },
        { name: '产品需求弹性', value: round((demandElasticity / 2.5) * 100), desc: '产品需求越有弹性，规模效应越强。' },
        { name: '资本调整能力', value: round(capitalFlexibility * 100), desc: '资本越容易调整，长期反应越充分。' },
        { name: '劳动成本占比', value: round((laborCostShare / 0.9) * 100), desc: '劳动成本占比越高，工资变化越影响总成本。' },
      ],
      wage_10pct_effect: round(-longElasticity * 10),
      diagnosis: `按希克斯-马歇尔派生需求法则，当前长期工资弹性约为 ${round(longElasticity, 2)}；工资上升 10% 时，劳动需求约变化 ${round(-longElasticity * 10)}%。`,
    },
    parameters: {
      product_price: round(productPrice),
      capital: fixedCapital,
      capital_rental_rate: round(rentalRate),
      sigma,
      technology_type: technologyType,
      product_demand_elasticity: demandElasticity,
      capital_flexibility: capitalFlexibility,
      labor_cost_share: laborCostShare,
      market_feedback: marketFeedback,
    },
  }
}

export function simulateAiDemandScenario(input = {}) {
  const baselineModel = simulateDemand({
    wage_initial: input.wageInitial ?? 55,
    wage_new: input.wageNew ?? input.wageInitial ?? 55,
    capital: input.capital ?? 700,
    sigma: input.sigma ?? 1.2,
    product_demand_elasticity: input.productDemandElasticity ?? 0.8,
    capital_flexibility: input.longRun === false ? 0.2 : 0.75,
  })
  const baselineEmployment = Number(input.baselineEmployment ?? baselineModel.short_run.point_a.labor)
  const taskAnalysis = analyzeOccupationTasks(input.tasks || occupationTemplates['人力资源专员'], {
    baselineEmployment,
    taskSubstitution: input.taskSubstitution ?? 55,
    aiProductivity: input.aiProductivity ?? 50,
    demandExpansion: input.demandExpansion ?? 45,
    complementarity: input.complementarity ?? 60,
    trainingInvestment: input.trainingInvestment ?? 50,
    aiCost: input.aiMarginalCost ?? 35,
  })
  const fixedCost = Math.max(0, Number(input.aiFixedCost ?? 20))
  const fixedCostDrag = baselineEmployment * fixedCost / 100 * 0.05
  const shortEmployment = Math.max(0, taskAnalysis.shortTermEmployment - fixedCostDrag)
  const longEmployment = Math.max(0, taskAnalysis.longTermEmployment - fixedCostDrag * 0.35)
  const productivity = Number(input.aiProductivity ?? 50)
  const baselineOutput = baselineModel.long_run.output_initial
  const outputShort = baselineOutput * (1 + productivity / 100 * 0.18) * (shortEmployment / baselineEmployment) ** 0.35
  const outputLong = baselineOutput * (1 + productivity / 100 * 0.36) * (longEmployment / baselineEmployment) ** 0.35
  const baseWages = baselineModel.long_run.long_curve.wages
  const baseLaborCurve = baselineModel.long_run.long_curve.labor
  const scenarioLaborCurve = baseLaborCurve.map(value => round(value * longEmployment / baselineEmployment))
  const baselineUnitCost = (Number(input.wageInitial ?? 55) * baselineEmployment) / Math.max(baselineOutput, 1)
  const scenarioUnitCost = (Number(input.wageInitial ?? 55) * longEmployment + fixedCost * baselineEmployment) / Math.max(outputLong, 1)
  const wageChange = taskAnalysis.highSkillChange * 0.08 + taskAnalysis.lowSkillChange * 0.02
  return {
    model: {
      name: 'AI任务重构下的派生劳动需求情景',
      formula: 'ΔL=替代效应+规模效应+互补效应+新任务效应−AI成本拖累',
      result_type: '情景推演结果',
    },
    baseline: { employment: round(baselineEmployment), output: round(baselineOutput), unit_cost: round(baselineUnitCost, 3) },
    short_term: { employment: round(shortEmployment), output: round(outputShort), wage_change_pct: round(wageChange * 0.45) },
    long_term: { employment: round(longEmployment), output: round(outputLong), wage_change_pct: round(wageChange), unit_cost: round(scenarioUnitCost, 3) },
    effects: { ...taskAnalysis.effects, fixedCost: round(-fixedCostDrag) },
    skill_structure: {
      high_skill_change: taskAnalysis.highSkillChange,
      low_skill_change: taskAnalysis.lowSkillChange,
      diagnosis: taskAnalysis.highSkillChange > 0 && taskAnalysis.lowSkillChange < 0
        ? '总就业变化之外，还发生低技能任务收缩与高技能任务扩张。'
        : '技能结构变化由当前任务份额、互补度和培训投入共同决定。',
    },
    curve: { wages: baseWages, baseline: baseLaborCurve, scenario: scenarioLaborCurve },
    conclusion: taskAnalysis.conclusion,
    boundary: '以上结果由用户显式设置的AI与需求参数产生，属于教材机制支持的情景推演，不是现实企业或地区的统计预测。',
    parameters: {
      aiProductivity: productivity,
      aiFixedCost: fixedCost,
      aiMarginalCost: Number(input.aiMarginalCost ?? 35),
      taskSubstitution: Number(input.taskSubstitution ?? 55),
      complementarity: Number(input.complementarity ?? 60),
      demandExpansion: Number(input.demandExpansion ?? 45),
      trainingInvestment: Number(input.trainingInvestment ?? 50),
    },
  }
}
