import { describe, expect, it } from 'vitest'
import { calculateIrr, simulateEducationInvestment } from './model'

const scenario = { annualDirectCost: 100, annualOpportunityCost: 50, investmentYears: 2, annualIncrement: 100, discountRate: 0, horizonYears: 5 }

describe('personal education investment differential cash flow', () => {
  it('starts at decision year zero and separates investment from return years', () => {
    const { rows } = simulateEducationInvestment(scenario)
    expect(rows.map(row => row.cashFlow)).toEqual([0, -150, -150, 100, 100, 100])
    expect(rows.map(row => row.phase)).toEqual(['决策起点', '投入期', '投入期', '回报期', '回报期', '回报期'])
    expect(rows[0].cumulativeDiscounted).toBe(0)
  })

  it('counts foregone earnings only during investment and allows zero opportunity cost', () => {
    const { rows } = simulateEducationInvestment({ ...scenario, annualOpportunityCost: 0 })
    expect(rows[1].cashFlow).toBe(-100)
    expect(rows[2].opportunityCost).toBe(0)
    expect(rows[3].cashFlow).toBe(100)
  })

  it('reduces NPV when the discount rate rises for a conventional cash flow', () => {
    const low = simulateEducationInvestment({ ...scenario, discountRate: 0.03 })
    const high = simulateEducationInvestment({ ...scenario, discountRate: 0.08 })
    expect(high.npv).toBeLessThan(low.npv)
  })

  it('uses the first nonnegative discounted cumulative year for payback', () => {
    const result = simulateEducationInvestment(scenario)
    expect(result.rows[4].cumulativeDiscounted).toBe(-100)
    expect(result.rows[5].cumulativeDiscounted).toBe(0)
    expect(result.paybackYear).toBe(5)
    expect(result.wageCrossoverYear).toBe(3)
  })

  it('says not yet paid back at the observation horizon', () => {
    const result = simulateEducationInvestment({ ...scenario, horizonYears: 4 })
    expect(result.paybackYear).toBeNull()
    expect(result.paybackStatus).toContain('截至第4年尚未回本')
    expect(result.npv).toBe(-100)
  })

  it('does not invent an IRR for no sign change or multiple sign changes', () => {
    expect(calculateIrr([0, -100, -50]).value).toBeNull()
    expect(calculateIrr([0, -100, 200, -50]).reason).toContain('多次变号')
    expect(calculateIrr([0, -100, 110]).value).toBeCloseTo(0.1, 7)
  })
})
