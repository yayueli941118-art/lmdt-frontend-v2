import { describe, expect, it } from 'vitest'
import { cesMarginalProducts, costMinBundle, simulateAiDemandScenario, simulateDemand } from './model'

describe('CES labor demand model', () => {
  it('has positive diminishing MPL when capital is fixed', () => {
    const lowLabor = cesMarginalProducts({ labor: 100, capital: 700, sigma: 1.2 })
    const highLabor = cesMarginalProducts({ labor: 300, capital: 700, sigma: 1.2 })
    expect(lowLabor.mpl).toBeGreaterThan(0)
    expect(highLabor.mpl).toBeLessThan(lowLabor.mpl)
  })

  it('satisfies the tangency condition at a cost-minimizing bundle', () => {
    const wage = 55
    const rentalRate = 16
    const bundle = costMinBundle({ output: 12000, wage, rentalRate, sigma: 1.2 })
    const mp = cesMarginalProducts({ labor: bundle.labor, capital: bundle.capital, sigma: 1.2 })
    expect(mp.mpl / mp.mpk).toBeCloseTo(wage / rentalRate, 5)
  })

  it('keeps the long-run effect decomposition internally consistent', () => {
    const result = simulateDemand({ wage_initial: 55, wage_new: 42, capital: 700, sigma: 1.2 })
    expect(result.long_run.substitution_effect + result.long_run.scale_effect)
      .toBeCloseTo(result.long_run.total_effect, 2)
  })

  it('finds a short-run point close to VMP equals wage', () => {
    const result = simulateDemand({ wage_initial: 55, wage_new: 42, capital: 700, sigma: 1.2 })
    expect(Math.abs(result.short_run.point_a.vmp - result.short_run.point_a.wage)).toBeLessThan(2)
  })

  it('lets AI scenarios produce decline, recovery or skill restructuring from explicit parameters', () => {
    const contraction = simulateAiDemandScenario({ taskSubstitution: 90, demandExpansion: 5, complementarity: 10, trainingInvestment: 5 })
    const expansion = simulateAiDemandScenario({ taskSubstitution: 30, demandExpansion: 90, complementarity: 85, trainingInvestment: 80, aiProductivity: 80 })
    expect(contraction.long_term.employment).toBeLessThan(contraction.baseline.employment)
    expect(expansion.long_term.employment).toBeGreaterThan(expansion.short_term.employment)
    expect(expansion.effects.substitution).toBeLessThan(0)
    expect(expansion.effects.scale).toBeGreaterThan(0)
    expect(expansion.boundary).toContain('情景推演')
  })
})
