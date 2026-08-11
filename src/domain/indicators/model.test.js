import { describe, expect, it } from 'vitest'
import { calculateIndicators, validateTimeSeries } from './model'

const rows = [
  { period: '2024', working_age_population: 1000, labor_force: 720, employed: 680, unemployed: 40, vacancies: 35, average_wage: 7200, median_wage: 6500 },
  { period: '2025', working_age_population: 1020, labor_force: 750, employed: 700, unemployed: 50, vacancies: 42, average_wage: 7560, median_wage: 6800 },
]

describe('labor market indicators', () => {
  it('calculates transparent rate and growth indicators', () => {
    const result = calculateIndicators(rows)
    expect(result.series[0].participation_rate).toBe(72)
    expect(result.series[1].unemployment_rate).toBeCloseTo(6.67, 2)
    expect(result.series[1].employment_growth_rate).toBeCloseTo(2.94, 2)
    expect(result.series[1].wage_growth_rate).toBe(5)
    expect(result.meta.unemployment_rate.denominator).toContain('劳动力人口')
  })

  it('blocks analysis for invalid denominators and reports inconsistencies', () => {
    const quality = validateTimeSeries([
      { ...rows[0], labor_force: 0, employed: 680, unemployed: 40 },
      { ...rows[0] },
    ])
    expect(quality.canAnalyze).toBe(false)
    expect(quality.errors.some(item => item.code === 'ZERO_DENOMINATOR')).toBe(true)
    expect(quality.errors.some(item => item.code === 'DUPLICATE_PERIOD')).toBe(true)
  })

  it('never silently fills missing values', () => {
    const quality = validateTimeSeries([{ ...rows[0], average_wage: '' }])
    expect(quality.rows[0].average_wage).toBeNull()
    expect(quality.warnings.some(item => item.code === 'MISSING_VALUE')).toBe(true)
  })
})
