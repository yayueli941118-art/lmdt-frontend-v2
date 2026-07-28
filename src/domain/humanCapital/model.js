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
