export function createRealtimeScheduler(callback, interval = 80) {
  let lastRunAt = 0
  let trailingTimer = null

  const runNow = () => {
    lastRunAt = Date.now()
    trailingTimer = null
    callback()
  }

  const schedule = () => {
    const remaining = interval - (Date.now() - lastRunAt)
    if (remaining <= 0) {
      clearTimeout(trailingTimer)
      runNow()
      return
    }

    clearTimeout(trailingTimer)
    trailingTimer = setTimeout(runNow, remaining)
  }

  schedule.cancel = () => {
    clearTimeout(trailingTimer)
    trailingTimer = null
  }

  return schedule
}
