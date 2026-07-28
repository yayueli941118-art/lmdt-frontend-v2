const round = (value, digits = 3) => Number(Number(value || 0).toFixed(digits))

export function gini(values) {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return 0
  const total = sorted.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return 0
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0)
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length
}

export function lorenz(values, groups = 20) {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  if (!sorted.length || total <= 0) return [[0, 0], [100, 100]]
  const points = [[0, 0]]
  let cumulative = 0
  sorted.forEach((value, index) => {
    cumulative += value
    const populationShare = (index + 1) / sorted.length
    const isBoundary = index === sorted.length - 1
      || Math.abs(populationShare * groups - Math.round(populationShare * groups)) < 1e-8
    if (isBoundary) {
      points.push([
        round(populationShare * 100, 1),
        round(cumulative / total * 100, 1),
      ])
    }
  })
  points[points.length - 1] = [100, 100]
  return points
}

function quantile(values, q) {
  const index = Math.floor((values.length - 1) * q)
  return values[index]
}

export function simulateDistribution(p = {}) {
  const skillPremium = Number(p.skill_premium ?? 35)
  const topShareShock = Number(p.top_share_shock ?? 25)
  const transferIntensity = Number(p.transfer_intensity ?? 20)
  const educationEqualizer = Number(p.education_equalizer ?? 15)

  const market = Array.from({ length: 400 }, (_, index) => {
    const rank = (index + 1) / 400
    const educationBoost = rank > 0.55 ? 1 + skillPremium / 100 : 1
    const topBoost = rank > 0.9 ? 1 + topShareShock / 55 : 1
    const opportunity = rank < 0.45 ? 1 + educationEqualizer / 180 : 1
    const wave = 1 + 0.08 * Math.sin(index * 1.73)
    return 3600 * (0.7 + rank * 1.9) * educationBoost * topBoost * opportunity * wave
  }).sort((a, b) => a - b)

  const average = market.reduce((sum, value) => sum + value, 0) / market.length
  const contributionRate = transferIntensity / 100 * 0.28
  const contributions = market.map(income => Math.max(0, income - average) * contributionRate)
  const contributionTotal = contributions.reduce((sum, value) => sum + value, 0)
  const needs = market.map(income => Math.max(0, average - income))
  const totalNeed = needs.reduce((sum, value) => sum + value, 0)
  const transfers = needs.map(value => contributionTotal * value / Math.max(totalNeed, 1))
  const transferTotal = transfers.reduce((sum, value) => sum + value, 0)
  const policy = market.map((income, index) =>
    income - contributions[index] + transfers[index]).sort((a, b) => a - b)

  const deciles = Array.from({ length: 10 }, (_, index) => {
    const start = index * 40
    const end = start + 40
    const marketAverage = market.slice(start, end).reduce((sum, value) => sum + value, 0) / 40
    const policyAverage = policy.slice(start, end).reduce((sum, value) => sum + value, 0) / 40
    return { label: `D${index + 1}`, market: round(marketAverage, 0), policy: round(policyAverage, 0) }
  })

  const marketTotal = market.reduce((sum, value) => sum + value, 0)
  const policyTotal = policy.reduce((sum, value) => sum + value, 0)
  return {
    series: { market, policy },
    lorenz: { market: lorenz(market), policy: lorenz(policy) },
    deciles,
    metrics: {
      market_gini: round(gini(market)),
      policy_gini: round(gini(policy)),
      p90_p10: round(quantile(policy, 0.9) / quantile(policy, 0.1), 2),
      bottom_gain_pct: round((deciles[0].policy / deciles[0].market - 1) * 100, 1),
    },
    budget: {
      market_income: round(marketTotal, 0),
      contributions: round(contributionTotal, 0),
      transfers: round(transferTotal, 0),
      policy_income: round(policyTotal, 0),
      net_cost: round(transferTotal - contributionTotal, 6),
    },
    model: {
      result_type: '合成家庭收入情景',
      note: '该分布用于演示收入分配机制，不是招聘工资样本，也不代表任何地区居民收入事实。',
    },
  }
}
