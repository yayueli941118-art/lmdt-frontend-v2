import { describe, expect, it } from 'vitest'
import { simulateDistribution } from './model'

describe('income distribution model', () => {
  it('produces valid monotonic Lorenz curves with exact endpoints', () => {
    const result = simulateDistribution()
    for (const points of Object.values(result.lorenz)) {
      expect(points[0]).toEqual([0, 0])
      expect(points.at(-1)).toEqual([100, 100])
      points.slice(1).forEach((point, index) => {
        expect(point[0]).toBeGreaterThanOrEqual(points[index][0])
        expect(point[1]).toBeGreaterThanOrEqual(points[index][1])
      })
    }
    expect(result.metrics.policy_gini).toBeGreaterThanOrEqual(0)
    expect(result.metrics.policy_gini).toBeLessThanOrEqual(1)
  })

  it('keeps redistribution budget balanced', () => {
    const result = simulateDistribution({ transfer_intensity: 45 })
    expect(result.budget.contributions).toBeCloseTo(result.budget.transfers, 0)
    expect(result.budget.net_cost).toBeCloseTo(0, 4)
  })
})
