const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round = (value, digits = 2) => Number(value.toFixed(digits))

function npvAtRate(cashFlows, rate) {
  return cashFlows.reduce((sum, value, index) =>
    sum + value / ((1 + rate) ** index), 0)
}

function estimateIrr(cashFlows) {
  let low = -0.95
  let high = 2
  if (npvAtRate(cashFlows, low) * npvAtRate(cashFlows, high) > 0) return null
  for (let index = 0; index < 100; index += 1) {
    const mid = (low + high) / 2
    if (npvAtRate(cashFlows, low) * npvAtRate(cashFlows, mid) <= 0) high = mid
    else low = mid
  }
  return (low + high) / 2
}

export function simulateMigration(input = {}) {
  const migrateAge = clamp(Number(input.migrate_age ?? 25), 18, 59)
  const retirementAge = clamp(Number(input.retirement_age ?? 60), migrateAge + 1, 70)
  const monthlyPremium = Number(input.w_diff ?? 3000)
  const movingCost = Math.max(Number(input.c_move ?? 20000), 0)
  const annualPsychologicalCost = Math.max(Number(input.c_psych ?? 3000), 0)
  const familyMigrate = Boolean(input.family_migrate)
  const annualSpouseLoss = familyMigrate ? Math.max(Number(input.spouse_loss ?? 0), 0) : 0
  const discountRate = clamp(Number(input.discount_rate ?? 0.04), 0, 0.3)
  const employmentProbability = clamp(Number(input.employment_probability ?? 0.9), 0, 1)
  const wageGrowth = clamp(Number(input.wage_growth ?? 0.02), -0.2, 0.2)
  const years = Array.from(
    { length: retirementAge - migrateAge },
    (_, index) => migrateAge + index + 1,
  )
  const annualCashFlows = years.map((_, index) => {
    const expectedPremium = monthlyPremium * 12 * employmentProbability * ((1 + wageGrowth) ** index)
    return expectedPremium - annualPsychologicalCost - annualSpouseLoss
  })
  const discountedCashFlows = annualCashFlows.map((value, index) =>
    value / ((1 + discountRate) ** (index + 1)))
  let cumulative = -movingCost
  const cumulativeNpv = discountedCashFlows.map(value => {
    cumulative += value
    return round(cumulative)
  })
  const paybackIndex = cumulativeNpv.findIndex(value => value >= 0)
  const annuityFactor = years.reduce(
    (sum, _, index) => sum + (
      employmentProbability * ((1 + wageGrowth) ** index)
    ) / ((1 + discountRate) ** (index + 1)),
    0,
  )
  const recurringCostPv = years.reduce(
    (sum, _, index) => sum + (
      annualPsychologicalCost + annualSpouseLoss
    ) / ((1 + discountRate) ** (index + 1)),
    0,
  )
  const requiredMonthlyPremium = (
    movingCost + recurringCostPv
  ) / Math.max(12 * annuityFactor, 1e-8)
  const cashFlows = [-movingCost, ...annualCashFlows]
  const irr = estimateIrr(cashFlows)
  return {
    status: 'success',
    model: {
      name: '预期收益贴现迁移模型',
      formula: 'NPV=-C0+Σ[p×ΔW_t-C_t]/(1+r)^t',
      result_type: '教材机制模拟',
    },
    migration: {
      is_calculated: true,
      years,
      annual_cash_flow: annualCashFlows.map(value => round(value)),
      discounted_cash_flow: discountedCashFlows.map(value => round(value)),
      cumulative_npv: cumulativeNpv,
      final_npv: cumulativeNpv.at(-1) ?? -movingCost,
      is_worth_it: (cumulativeNpv.at(-1) ?? -movingCost) > 0,
      payback_age: paybackIndex >= 0 ? years[paybackIndex] : null,
      required_monthly_premium: round(requiredMonthlyPremium),
      irr_pct: irr === null ? null : round(irr * 100),
      parameters: {
        migrate_age: migrateAge,
        retirement_age: retirementAge,
        monthly_wage_premium: monthlyPremium,
        moving_cost: movingCost,
        annual_psychological_cost: annualPsychologicalCost,
        annual_spouse_loss: annualSpouseLoss,
        discount_rate: discountRate,
        employment_probability: employmentProbability,
        wage_growth: wageGrowth,
      },
      sensitivity: [0, 0.02, 0.04, 0.06, 0.08, 0.1].map(rate => ({
        discount_rate: rate,
        npv: round(-movingCost + annualCashFlows.reduce(
          (sum, value, index) => sum + value / ((1 + rate) ** (index + 1)),
          0,
        )),
      })),
    },
  }
}
