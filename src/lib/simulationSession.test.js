import { describe, expect, it, vi } from 'vitest'
import { useSimulationSession } from './simulationSession'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('simulation session', () => {
  it('commits only the newest request when responses arrive out of order', async () => {
    const first = deferred()
    const second = deferred()
    const commit = vi.fn()
    const session = useSimulationSession()

    const firstRun = session.runLatest(() => first.promise, commit)
    const secondRun = session.runLatest(() => second.promise, commit)
    second.resolve('new')
    await secondRun
    first.resolve('old')
    await firstRun

    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('new')
    expect(session.loading.value).toBe(false)
  })

  it('shows the latest error and clears the previous result', async () => {
    const clearResult = vi.fn()
    const session = useSimulationSession({ clearResult })

    await session.runLatest(
      () => Promise.reject(new RangeError('参数超出可行范围')),
      vi.fn(),
    )

    expect(session.error.value).toBe('参数超出可行范围')
    expect(clearResult).toHaveBeenCalledOnce()
  })
})
