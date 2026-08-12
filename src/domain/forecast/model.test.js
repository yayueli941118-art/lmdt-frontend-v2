import { describe, expect, it } from 'vitest'
import { calculateErrors, runForecast } from './model'

describe('basic forecast model', () => {
  it('backtests transparent methods and keeps future scenarios distinct from confidence intervals', () => {
    const series = [100, 108, 116, 124, 132, 140, 148, 156]
    const result = runForecast(series, { method: 'linear', testSize: 2, horizon: 3, optimisticRate: 6, pessimisticRate: -4 })
    expect(result.backtest.predictions).toHaveLength(2)
    expect(result.future.baseline).toHaveLength(3)
    expect(result.future.optimistic[2]).toBeGreaterThan(result.future.baseline[2])
    expect(result.future.isConfidenceInterval).toBe(false)
  })

  it('excludes zero actual values from MAPE and reports effective sample size', () => {
    const errors = calculateErrors([0, 10, 20], [2, 12, 18])
    expect(errors.mapeSamples).toBe(2)
    expect(errors.mae).toBe(2)
    expect(errors.mape).toBe(15)
  })

  it('supports naive, moving average, linear trend and CAGR', () => {
    for (const method of ['naive', 'moving_average', 'linear', 'cagr']) {
      const result = runForecast([10, 12, 14, 16, 18, 20], { method, testSize: 2, horizon: 2, k: 3 })
      expect(result.future.baseline.every(Number.isFinite)).toBe(true)
    }
  })

  it('rejects an empty or too-short series instead of reporting zero-error forecasts', () => {
    expect(() => runForecast([], { testSize: 3 })).toThrow(/至少需要 4 期/)
    expect(() => runForecast([10, 12, 14], { testSize: 1 })).toThrow(/至少需要 4 期/)
  })
})
