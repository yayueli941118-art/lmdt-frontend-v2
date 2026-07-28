import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRealtimeScheduler } from './realtime'

afterEach(() => {
  vi.useRealTimers()
})

describe('createRealtimeScheduler', () => {
  it('runs immediately and continues at the throttle interval during repeated input', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const callback = vi.fn()
    const schedule = createRealtimeScheduler(callback, 80)

    schedule()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.setSystemTime(1_020)
    schedule()
    vi.setSystemTime(1_050)
    schedule()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(30)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('can cancel a pending trailing update', () => {
    vi.useFakeTimers()
    vi.setSystemTime(2_000)
    const callback = vi.fn()
    const schedule = createRealtimeScheduler(callback, 80)

    schedule()
    vi.setSystemTime(2_020)
    schedule()
    schedule.cancel()
    vi.advanceTimersByTime(80)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
