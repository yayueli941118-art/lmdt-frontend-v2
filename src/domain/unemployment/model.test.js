import { describe, expect, it } from 'vitest'
import {
  simulateBeveridge,
  simulateDmp,
  simulateMinimumWage,
  simulateSearch,
  simulateUnemployment,
} from './model'

describe('unemployment and matching models', () => {
  it('converts matching hazards to bounded period probabilities', () => {
    const result = simulateDmp({ unemployed: 120, vacancies: 80, matching_efficiency: 0.65 })
    expect(result.matches).toBeLessThanOrEqual(80)
    expect(result.job_finding_rate).toBeGreaterThanOrEqual(0)
    expect(result.job_finding_rate).toBeLessThanOrEqual(100)
    expect(result.vacancy_filling_rate).toBeLessThanOrEqual(100)
  })

  it('higher matching efficiency lowers steady unemployment', () => {
    const low = simulateDmp({ matching_efficiency: 0.25 })
    const high = simulateDmp({ matching_efficiency: 0.9 })
    expect(high.steady_unemployment_rate).toBeLessThan(low.steady_unemployment_rate)
  })

  it('distinguishes structural curve shifts from cyclical movement', () => {
    const baseline = simulateBeveridge({ mismatch_index: 0.2, ai_risk: 10 })
    const structural = simulateBeveridge({ mismatch_index: 1.8, ai_risk: 80 })
    expect(structural.curve_points[20].v).toBeGreaterThan(baseline.curve_points[20].v)
    expect(structural.movement_type).toBe('曲线整体移动')
  })

  it('reports minimum wage assumptions instead of unsupported benchmarks', () => {
    const result = simulateMinimumWage({ min_wage: 35, avg_wage: 50, demand_elasticity: -0.2 })
    expect(result.kaitz_index).toBe(0.7)
    expect(result.assumptions.demand_elasticity).toBe(-0.2)
    expect(result).not.toHaveProperty('benchmarks')
  })

  it('never reports negative employment when an extreme elasticity leaves the linear range', () => {
    const result = simulateMinimumWage({
      min_wage: 60,
      avg_wage: 20,
      employment: 200,
      demand_elasticity: -0.5,
    })

    expect(result.predicted_employment).toBe(0)
    expect(result.employment_change_pct).toBe(-100)
    expect(result.validity_warning).toContain('线性弹性近似')
  })

  it('does not double count the natural rate as frictional unemployment', () => {
    const result = simulateUnemployment({ natural_rate: 5, skill_mismatch: 0.8 })
    expect(result.natural_unemployment_rate).toBeCloseTo(
      result.breakdown.frictional + result.breakdown.structural,
      1,
    )
  })

  it('raises the reservation wage when unemployment benefits increase', () => {
    const low = simulateSearch({ benefit: 1000 })
    const high = simulateSearch({ benefit: 4000 })
    expect(high.reservation_wage).toBeGreaterThan(low.reservation_wage)
    expect(high.expected_search_duration_months).toBeGreaterThan(low.expected_search_duration_months)
  })
})
