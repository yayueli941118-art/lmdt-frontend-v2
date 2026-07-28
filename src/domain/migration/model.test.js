import { describe, expect, it } from 'vitest'
import { simulateMigration } from './model'

const positiveCase = {
  migrate_age: 25,
  w_diff: 3000,
  c_move: 20000,
  c_psych: 3000,
  employment_probability: 0.9,
  wage_growth: 0.02,
}

describe('migration NPV model', () => {
  it('does not increase NPV when the discount rate rises and future net benefits are positive', () => {
    const low = simulateMigration({ ...positiveCase, discount_rate: 0.02 })
    const high = simulateMigration({ ...positiveCase, discount_rate: 0.08 })
    expect(high.migration.final_npv).toBeLessThan(low.migration.final_npv)
  })

  it('raises the migration threshold when employment probability falls', () => {
    const highProbability = simulateMigration({ ...positiveCase, employment_probability: 0.95 })
    const lowProbability = simulateMigration({ ...positiveCase, employment_probability: 0.55 })
    expect(lowProbability.migration.required_monthly_premium)
      .toBeGreaterThan(highProbability.migration.required_monthly_premium)
  })
})
