const round = (value, digits = 2) => Number(value.toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function monthlyWage({ education, experience, discrimination = 0, trainingFactor = 1 }) {
  const lnWage = 7.35 + 0.085 * education + 0.055 * experience - 0.0009 * (experience ** 2)
  return Math.exp(lnWage) * trainingFactor * (1 - discrimination)
}

function npvAtRate(cashFlows, rate) {
  return cashFlows.reduce((sum, value, index) =>
    sum + value / ((1 + rate) ** index), 0)
}

function estimateIrr(cashFlows) {
  let low = -0.9
  let high = 1.5
  if (npvAtRate(cashFlows, low) * npvAtRate(cashFlows, high) > 0) return null
  for (let index = 0; index < 100; index += 1) {
    const mid = (low + high) / 2
    if (npvAtRate(cashFlows, low) * npvAtRate(cashFlows, mid) <= 0) high = mid
    else low = mid
  }
  return (low + high) / 2
}

export const CAPABILITY_DIMENSIONS = [
  ['professional_knowledge', '专业知识', '知识基础'],
  ['vocational_skill', '职业技能', '知识基础'],
  ['digital_ai', '数字与AI应用能力', '数字能力'],
  ['data_evidence', '数据分析与证据判断', '数字能力'],
  ['cognitive', '认知能力', '通用能力'],
  ['non_cognitive', '非认知能力', '通用能力'],
  ['communication', '沟通协作', '通用能力'],
  ['self_management', '自我管理', '通用能力'],
  ['physical_health', '身体健康', '可持续发展'],
  ['mental_health', '心理健康', '可持续发展'],
  ['industry_experience', '行业经验', '职业资本'],
  ['social_network', '社会网络', '职业资本'],
  ['continuous_learning', '持续学习能力', '可持续发展'],
].map(([id, label, group]) => ({ id, label, group }))

export function buildCapabilityInvestmentPlan(input = {}) {
  const ratings = input.ratings || {}
  const target = input.target || {}
  const gaps = CAPABILITY_DIMENSIONS.map(item => ({
    ...item,
    current: clamp(Number(ratings[item.id] ?? 50), 0, 100),
    target: clamp(Number(target[item.id] ?? 70), 0, 100),
  })).map(item => ({ ...item, gap: round(Math.max(0, item.target - item.current), 1) }))
    .sort((a, b) => b.gap - a.gap)
  const averageCurrent = gaps.reduce((sum, item) => sum + item.current, 0) / gaps.length
  const averageGap = gaps.reduce((sum, item) => sum + item.gap, 0) / gaps.length
  const weeklyHours = clamp(Number(input.weeklyHours ?? 6), 1, 30)
  const moneyCost = Math.max(0, Number(input.moneyCost ?? 1500))
  const opportunityCost = Math.max(0, Number(input.opportunityCost ?? 2500))
  const monthlyBenefit = Math.max(0, Number(input.monthlyBenefit ?? 400))
  const dynamicComplementarity = round((averageCurrent / 100) * (1 + weeklyHours / 30), 2)
  const monthlyFlows = [-(moneyCost + opportunityCost)]
  for (let month = 1; month <= 24; month += 1) {
    const ramp = month <= 3 ? month / 3 : 1
    monthlyFlows.push(monthlyBenefit * dynamicComplementarity * ramp)
  }
  const monthlyRate = Number(input.discountRate ?? 0.04) / 12
  const npv = monthlyFlows.reduce((sum, flow, month) => sum + flow / ((1 + monthlyRate) ** month), 0)
  const priorities = gaps.slice(0, 3)
  const stages = [
    { days: '1-30天', focus: priorities[0]?.label || '基础能力', action: '完成基础课程与概念清单', evidence: '一份可复核的知识测验或学习笔记' },
    { days: '31-60天', focus: priorities[1]?.label || priorities[0]?.label || '应用能力', action: '完成一个岗位情景小项目', evidence: '数据表、分析过程和版本记录' },
    { days: '61-90天', focus: priorities[2]?.label || priorities[0]?.label || '迁移能力', action: '在新任务中迁移并接受同伴核查', evidence: '修订前后作品与反馈说明' },
  ]
  return {
    gaps,
    priorities,
    averageCurrent: round(averageCurrent, 1),
    averageGap: round(averageGap, 1),
    dynamicComplementarity,
    stages,
    costs: { weeklyHours, moneyCost, opportunityCost, total: moneyCost + opportunityCost },
    npv: round(npv),
    scenarioReturn: round(monthlyFlows.slice(1).reduce((sum, value) => sum + value, 0)),
    riskLevel: averageGap >= 30 ? '需优先投资' : averageGap >= 15 ? '存在结构性缺口' : '与目标较接近',
    boundary: '所有能力分值均为教学自评情景，不是心理诊断、人格测评或真实生产率估计；回报为用户假设下的情景NPV。',
  }
}

export function simulateHumanCapital(input = {}) {
  const education = clamp(Number(input.edu ?? 16), 9, 22)
  const baselineEducation = 12
  const discrimination = clamp(Number(input.disc ?? 0) / 100, 0, 0.8)
  const discountRate = clamp(Number(input.discount_rate ?? 0.04), 0, 0.25)
  const annualDirectCost = Math.max(Number(input.direct_cost ?? 12000), 0)
  const trainingType = String(input.train_type || '无额外培训')
  const training = trainingType.includes('一般')
    ? { workerCost: 8000, firmCost: 0, factor: 1.07, label: '一般培训：通用技能回报主要由劳动者获得。' }
    : trainingType.includes('特殊')
      ? { workerCost: 3000, firmCost: 9000, factor: 1.045, label: '特殊培训：企业专属收益需要企业与劳动者共同分担。' }
      : { workerCost: 0, firmCost: 0, factor: 1, label: '未设置额外在职培训。' }
  const ages = Array.from({ length: 43 }, (_, index) => index + 18)
  const baselineGraduationAge = baselineEducation + 6
  const selectedGraduationAge = education + 6
  const baselineWages = ages.map(age => monthlyWage({
    education: baselineEducation,
    experience: Math.max(age - baselineGraduationAge, 0),
  }))
  const selectedGrossWages = ages.map(age => {
    if (age < selectedGraduationAge) return 0
    return monthlyWage({
      education,
      experience: Math.max(age - selectedGraduationAge, 0),
      trainingFactor: training.factor,
    })
  })
  const selectedNetWages = selectedGrossWages.map(value => value * (1 - discrimination))
  const incrementalCashFlows = ages.map((age, index) => {
    if (age < selectedGraduationAge) {
      return -(baselineWages[index] * 12) - annualDirectCost
    }
    const trainingCost = age === selectedGraduationAge ? training.workerCost : 0
    return (selectedNetWages[index] - baselineWages[index]) * 12 - trainingCost
  })
  let cumulative = 0
  const cumulativeNpv = incrementalCashFlows.map((value, index) => {
    cumulative += value / ((1 + discountRate) ** index)
    return round(cumulative)
  })
  const paybackIndex = cumulativeNpv.findIndex((value, index) =>
    ages[index] >= selectedGraduationAge && value >= 0)
  const crossoverIndex = selectedNetWages.findIndex((value, index) =>
    ages[index] >= selectedGraduationAge && value >= baselineWages[index])
  const baselineLifetime = baselineWages.reduce((sum, value) => sum + value * 12, 0)
  const selectedLifetime = selectedNetWages.reduce((sum, value) => sum + value * 12, 0)
  const irr = estimateIrr(incrementalCashFlows)
  return {
    status: 'success',
    model: {
      name: '明瑟工资路径与人力资本投资现金流',
      formula: 'ln(W)=α+βS+γX+δX²；NPV=ΣΔCF_t/(1+r)^t',
      result_type: '教材机制模拟',
    },
    metrics: {
      lifetime_premium_pct: round(((selectedLifetime / baselineLifetime) - 1) * 100),
      discrimination_loss_pct: round(discrimination * 100),
      breakeven_age: paybackIndex >= 0 ? ages[paybackIndex] : null,
      crossover_age: crossoverIndex >= 0 ? ages[crossoverIndex] : null,
      irr_pct: irr === null ? null : round(irr * 100),
      npv: round(cumulativeNpv.at(-1) || 0),
      direct_cost_total: round(Math.max(selectedGraduationAge - 18, 0) * annualDirectCost),
      opportunity_cost_total: round(ages.reduce((sum, age, index) =>
        age < selectedGraduationAge ? sum + baselineWages[index] * 12 : sum, 0)),
      training_worker_cost: training.workerCost,
      training_firm_cost: training.firmCost,
      training_explanation: training.label,
    },
    charts: {
      age_years: ages,
      wage_curve_selected: selectedGrossWages.map((value, index) =>
        ages[index] < selectedGraduationAge ? -2 : round(value)),
      wage_curve_baseline: baselineWages.map(value => round(value)),
      wage_curve_disc: selectedNetWages.map((value, index) =>
        ages[index] < selectedGraduationAge ? -2 : round(value)),
      wage_curve_selected_gross: selectedGrossWages.map(value => round(value)),
      annual_cash_flow: incrementalCashFlows.map(value => round(value)),
      cumulative_npv: cumulativeNpv,
    },
    migration: { is_calculated: false, years: [], cumulative_npv: [], is_worth_it: false },
  }
}
