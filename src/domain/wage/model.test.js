import { describe, expect, it } from 'vitest'
import { simulateMincer, simulateWageDistribution, simulateWageTheory } from './model'

describe('wage theory models', () => {
  it('labels deterministic distributions as synthetic samples', () => {
    const result = simulateWageDistribution()
    expect(result.model.result_type).toContain('合成')
    expect(result.statistics.gini).toBeGreaterThanOrEqual(0)
    expect(result.statistics.gini).toBeLessThanOrEqual(1)
  })

  it('keeps the Mincer identity internally consistent', () => {
    const result = simulateMincer({ edu_years: 16, exp_years: 8 })
    const sum = Object.values(result.decomposition).reduce((total, value) => total + value, 0)
    expect(sum).toBeCloseTo(result.ln_wage, 3)
  })

  it('raises required compensation when job risk rises', () => {
    const low = simulateWageTheory({ mode: 'compensating', risk: 10 })
    const high = simulateWageTheory({ mode: 'compensating', risk: 80 })
    expect(high.metrics.required_wage).toBeGreaterThan(low.metrics.required_wage)
  })

  it('shows the efficiency wage trade-off without claiming a universal optimum', () => {
    const low = simulateWageTheory({ mode: 'efficiency', wage: 6000 })
    const high = simulateWageTheory({ mode: 'efficiency', wage: 9000 })
    expect(high.metrics.effort_index).toBeGreaterThan(low.metrics.effort_index)
    expect(high.metrics.turnover_risk).toBeLessThan(low.metrics.turnover_risk)
  })
})
