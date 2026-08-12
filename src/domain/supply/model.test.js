import { describe, expect, it } from 'vitest'
import { simulateSupply } from './model'

describe('textbook labor supply model', () => {
  const baseline = {
    wage_initial: 28,
    wage_new: 64,
    beta: 0.3,
    non_labor_income: 300,
    non_labor_shock: 160,
    consumption_floor: 20,
    leisure_floor: 2,
    T: 24,
  }

  it('keeps utility fixed at the Hicks compensated point', () => {
    const result = simulateSupply(baseline)
    expect(result.point_B.utility).toBeCloseTo(result.point_A.utility, 4)
  })

  it('decomposes total wage effect exactly', () => {
    const result = simulateSupply(baseline)
    const effects = result.effects
    expect(effects.substitution_effect_hours + effects.income_effect_hours)
      .toBeCloseTo(effects.total_effect_hours, 2)
  })

  it('reduces work when non-labor income rises', () => {
    const result = simulateSupply(baseline)
    expect(result.point_Z.labor_hours).toBeLessThan(result.point_A.labor_hours)
  })

  it('can reproduce textbook figure 2-11 without changing preferences', () => {
    const result = simulateSupply({
      ...baseline,
      wage_initial: 36,
      wage_new: 116,
      non_labor_income: 120,
      consumption_floor: 420,
      beta: 0.42,
    })
    expect(result.point_C.labor_hours).toBeLessThan(result.point_A.labor_hours)
    expect(result.point_B.utility).toBeCloseTo(result.point_A.utility, 4)
  })

  it('rejects a budget that cannot cover the minimum consumption and leisure commitments', () => {
    expect(() => simulateSupply({
      ...baseline,
      wage_initial: 10,
      wage_new: 12,
      non_labor_income: 0,
      consumption_floor: 600,
      leisure_floor: 8,
    })).toThrow(/最低消费与最低闲暇/)
  })
})
