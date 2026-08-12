import { boundedNumber, finiteNumber, nonNegativeNumber } from '../shared/numbers'

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
  const migrateAge = boundedNumber(input.migrate_age, 25, 18, 59, '迁移年龄')
  const retirementAge = boundedNumber(input.retirement_age, 60, migrateAge + 1, 70, '退休年龄')
  const monthlyPremium = finiteNumber(input.w_diff, 3000, '月工资溢价')
  const movingCost = nonNegativeNumber(input.c_move, 20000, '搬迁成本')
  const annualPsychologicalCost = nonNegativeNumber(input.c_psych, 3000, '年度心理成本')
  const familyMigrate = Boolean(input.family_migrate)
  const annualSpouseLoss = familyMigrate ? nonNegativeNumber(input.spouse_loss, 0, '配偶年度收入损失') : 0
  const discountRate = boundedNumber(input.discount_rate, 0.04, 0, 0.3, '贴现率')
  const employmentProbability = boundedNumber(input.employment_probability, 0.9, 0, 1, '就业概率')
  const wageGrowth = boundedNumber(input.wage_growth, 0.02, -0.2, 0.2, '工资增长率')
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
