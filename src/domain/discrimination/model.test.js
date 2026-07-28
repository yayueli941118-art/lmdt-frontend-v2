import { describe, expect, it } from 'vitest'
import {
  simulateBecker,
  simulateDiscrimination,
  simulateStatisticalDiscrimination,
} from './model'

function samples(intercept) {
  const education = Array.from({ length: 30 }, (_, index) => 10 + (index % 8))
  const experience = Array.from({ length: 30 }, (_, index) => 2 + index)
  const wages = education.map((value, index) =>
    Math.exp(intercept + 0.08 * value + 0.04 * experience[index] - 0.0005 * experience[index] ** 2))
  return { education, experience, wages }
}

describe('Oaxaca-Blinder model', () => {
  it('estimates coefficients from the supplied samples', () => {
    const a = samples(7.2)
    const b = samples(7.5)
    const result = simulateDiscrimination({
      group_a_wages: a.wages,
      group_a_edu: a.education,
      group_a_exp: a.experience,
      group_b_wages: b.wages,
      group_b_edu: b.education,
      group_b_exp: b.experience,
    })
    expect(result.coefficients.group_a[1]).toBeCloseTo(0.08, 3)
    expect(result.coefficients.group_b[0]).toBeCloseTo(7.5, 2)
    expect(result.decomposition.total_gap_ln).toBeCloseTo(0.3, 3)
  })

  it('rejects undersized samples instead of fabricating coefficients', () => {
    const result = simulateDiscrimination({
      group_a_wages: [1, 2],
      group_b_wages: [1, 2],
    })
    expect(result.error).toBeTruthy()
  })

  it('raises perceived wage and lowers demand when Becker d rises', () => {
    const low = simulateBecker({ discrimination_coefficient: 0.1 })
    const high = simulateBecker({ discrimination_coefficient: 0.6 })
    expect(high.perceived_wage).toBeGreaterThan(low.perceived_wage)
    expect(high.relative_labor_demand_pct).toBeLessThan(low.relative_labor_demand_pct)
  })

  it('uses the individual signal more when reliability improves', () => {
    const low = simulateStatisticalDiscrimination({
      signal: 80,
      group_prior: 50,
      signal_reliability: 0.2,
    })
    const high = simulateStatisticalDiscrimination({
      signal: 80,
      group_prior: 50,
      signal_reliability: 0.9,
    })
    expect(high.evaluated_productivity).toBeGreaterThan(low.evaluated_productivity)
    expect(high.prior_weight_pct).toBeLessThan(low.prior_weight_pct)
  })
})
