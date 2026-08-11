import { describe, expect, it } from 'vitest'
import { buildCapabilityInvestmentPlan, CAPABILITY_DIMENSIONS, simulateHumanCapital } from './model'

describe('human capital cash-flow model', () => {
  it('includes direct and opportunity costs for post-secondary education', () => {
    const result = simulateHumanCapital({ edu: 16, direct_cost: 12000 })
    expect(result.metrics.direct_cost_total).toBe(48000)
    expect(result.metrics.opportunity_cost_total).toBeGreaterThan(0)
  })

  it('reduces NPV when the discount rate increases', () => {
    const low = simulateHumanCapital({ edu: 16, discount_rate: 0.02 })
    const high = simulateHumanCapital({ edu: 16, discount_rate: 0.1 })
    expect(high.metrics.npv).toBeLessThan(low.metrics.npv)
  })

  it('assigns part of special-training cost to the firm', () => {
    const result = simulateHumanCapital({ edu: 16, train_type: '特殊培训 (企业专属技能)' })
    expect(result.metrics.training_firm_cost).toBeGreaterThan(0)
    expect(result.metrics.training_worker_cost).toBeGreaterThan(0)
  })

  it('builds a transparent capability gap and 90-day investment plan', () => {
    const ratings = Object.fromEntries(CAPABILITY_DIMENSIONS.map(item => [item.id, 55]))
    const target = Object.fromEntries(CAPABILITY_DIMENSIONS.map(item => [item.id, item.id === 'data_evidence' ? 90 : 70]))
    const plan = buildCapabilityInvestmentPlan({ ratings, target, weeklyHours: 8, moneyCost: 1800, opportunityCost: 3200, monthlyBenefit: 500 })
    expect(plan.gaps[0].id).toBe('data_evidence')
    expect(plan.stages).toHaveLength(3)
    expect(plan.npv).toBeTypeOf('number')
    expect(plan.boundary).toContain('教学自评情景')
  })
})
