export const EDUCATION_EXAMPLES = Object.freeze({
  考研: { annualDirectCost: 12000, investmentYears: 2, annualOpportunityCost: 42000, annualIncrement: 24000, discountRate: 0.05, horizonYears: 20 },
  考证: { annualDirectCost: 6000, investmentYears: 1, annualOpportunityCost: 0, annualIncrement: 5000, discountRate: 0.05, horizonYears: 12 },
  培训: { annualDirectCost: 10000, investmentYears: 1, annualOpportunityCost: 10000, annualIncrement: 8000, discountRate: 0.05, horizonYears: 12 },
  本科: { annualDirectCost: 12000, investmentYears: 4, annualOpportunityCost: 30000, annualIncrement: 18000, discountRate: 0.05, horizonYears: 30 },
  自定义: { annualDirectCost: 8000, investmentYears: 2, annualOpportunityCost: 0, annualIncrement: 10000, discountRate: 0.05, horizonYears: 15 },
})

const bounded = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min))

export function npvAtRate(cashFlows, rate) {
  return cashFlows.reduce((total, cashFlow, year) => total + cashFlow / (1 + rate) ** year, 0)
}

export function calculateIrr(cashFlows) {
  const signs = cashFlows.map(value => Math.sign(value)).filter(Boolean)
  const changes = signs.slice(1).reduce((count, sign, index) => count + Number(sign !== signs[index]), 0)
  if (!changes) return { value: null, reason: '无正负现金流，IRR 无定义' }
  if (changes > 1) return { value: null, reason: '现金流多次变号，单一 IRR 不适用' }

  let low = -0.999
  let high = 1
  const lowValue = npvAtRate(cashFlows, low)
  let highValue = npvAtRate(cashFlows, high)
  while (Math.sign(lowValue) === Math.sign(highValue) && high < 1024) {
    high *= 2
    highValue = npvAtRate(cashFlows, high)
  }
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || Math.sign(lowValue) === Math.sign(highValue)) {
    return { value: null, reason: '在可计算区间内无 IRR 解' }
  }
  for (let index = 0; index < 100; index += 1) {
    const mid = (low + high) / 2
    if (Math.sign(npvAtRate(cashFlows, mid)) === Math.sign(lowValue)) low = mid
    else high = mid
  }
  return { value: (low + high) / 2, reason: '' }
}

export function simulateEducationInvestment(input = {}) {
  const investmentYears = Math.round(bounded(input.investmentYears ?? 2, 0, 10))
  const horizonYears = Math.round(bounded(input.horizonYears ?? 20, 0, 40))
  const annualDirectCost = bounded(input.annualDirectCost ?? 12000, 0, 1000000)
  const annualOpportunityCost = bounded(input.annualOpportunityCost ?? 42000, 0, 1000000)
  const annualIncrement = bounded(input.annualIncrement ?? 24000, 0, 1000000)
  const discountRate = bounded(input.discountRate ?? 0.05, 0, 0.5)
  let cumulative = 0
  let sawDeficit = false
  let paybackYear = null
  const rows = []

  for (let year = 0; year <= horizonYears; year += 1) {
    const investing = year > 0 && year <= investmentYears
    const directCost = investing ? annualDirectCost : 0
    const opportunityCost = investing ? annualOpportunityCost : 0
    const incrementalEarnings = year > investmentYears && year > 0 ? annualIncrement : 0
    const cashFlow = incrementalEarnings - directCost - opportunityCost
    const discountedCashFlow = cashFlow / (1 + discountRate) ** year
    cumulative += discountedCashFlow
    if (cumulative < -1e-8) sawDeficit = true
    if (sawDeficit && paybackYear === null && cumulative >= -1e-8) paybackYear = year
    rows.push({ year, phase: year === 0 ? '决策起点' : investing ? '投入期' : '回报期', directCost, opportunityCost, incrementalEarnings, cashFlow, discountedCashFlow, cumulativeDiscounted: cumulative })
  }

  const cashFlows = rows.map(row => row.cashFlow)
  return {
    rows,
    npv: cumulative,
    paybackYear,
    paybackStatus: paybackYear !== null ? `第${paybackYear}年折现回本` : sawDeficit ? `截至第${horizonYears}年尚未回本（按当前假设）` : '无前期净投入，折现回收期不适用',
    wageCrossoverYear: annualIncrement > 0 && investmentYears < horizonYears ? investmentYears + 1 : null,
    irr: calculateIrr(cashFlows),
    assumptions: { investmentYears, horizonYears, annualDirectCost, annualOpportunityCost, annualIncrement, discountRate },
  }
}
