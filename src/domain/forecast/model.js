const round = (value, digits = 2) => Number(Number(value).toFixed(digits))

export const forecastMethods = {
  naive: { label: '上一期值法', formula: 'ŷ(t+1)=y(t)', boundary: '适合作为基准，不会主动延续趋势。' },
  moving_average: { label: 'k期移动平均', formula: 'ŷ(t+1)=最近k期观测值平均数', boundary: '能平滑波动，也可能滞后于趋势转折。' },
  linear: { label: '线性趋势外推', formula: 'ŷ(t)=a+bt（最小二乘趋势）', boundary: '假设历史线性趋势在预测期继续。' },
  cagr: { label: '平均增长率/CAGR', formula: 'g=(末值/初值)^(1/n)-1', boundary: '要求起点和终点为正，易受端点选择影响。' },
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function linearNext(values) {
  const n = values.length
  if (n < 2) return values.at(-1) ?? 0
  const xMean = (n - 1) / 2
  const yMean = mean(values)
  const numerator = values.reduce((sum, value, index) => sum + (index - xMean) * (value - yMean), 0)
  const denominator = values.reduce((sum, _, index) => sum + (index - xMean) ** 2, 0)
  const slope = denominator ? numerator / denominator : 0
  return yMean + slope * (n - xMean)
}

export function predictNext(history, method = 'naive', k = 3) {
  const values = history.filter(Number.isFinite)
  if (!values.length) return 0
  if (method === 'moving_average') return mean(values.slice(-Math.max(1, Math.min(k, values.length))))
  if (method === 'linear') return linearNext(values)
  if (method === 'cagr') {
    const first = values[0]
    const last = values.at(-1)
    if (values.length < 2 || first <= 0 || last <= 0) return last
    const growth = (last / first) ** (1 / (values.length - 1)) - 1
    return last * (1 + growth)
  }
  return values.at(-1)
}

export function calculateErrors(actual = [], predicted = []) {
  const pairs = actual.map((value, index) => ({ actual: Number(value), predicted: Number(predicted[index]) }))
    .filter(item => Number.isFinite(item.actual) && Number.isFinite(item.predicted))
  const absolute = pairs.map(item => Math.abs(item.actual - item.predicted))
  const squared = pairs.map(item => (item.actual - item.predicted) ** 2)
  const percentage = pairs.filter(item => item.actual !== 0)
    .map(item => Math.abs((item.actual - item.predicted) / item.actual) * 100)
  return {
    mae: round(mean(absolute)),
    rmse: round(Math.sqrt(mean(squared))),
    mape: percentage.length ? round(mean(percentage)) : null,
    samples: pairs.length,
    mapeSamples: percentage.length,
    zeroActualExcluded: pairs.length - percentage.length,
  }
}

export function runForecast(inputSeries = [], options = {}) {
  const values = inputSeries.map(Number).filter(Number.isFinite)
  const method = forecastMethods[options.method] ? options.method : 'naive'
  const testSize = Math.max(1, Math.min(Number(options.testSize ?? 3), Math.max(1, values.length - 3)))
  const horizon = Math.max(1, Math.min(Number(options.horizon ?? 3), 12))
  const k = Math.max(1, Number(options.k ?? 3))
  const splitIndex = values.length - testSize
  const predictions = []
  for (let index = splitIndex; index < values.length; index += 1) {
    predictions.push(predictNext(values.slice(0, index), method, k))
  }
  const fitted = values.map((_, index) => index === 0 ? null : round(predictNext(values.slice(0, index), method, k)))
  const futureBaseline = []
  const recursive = [...values]
  for (let step = 0; step < horizon; step += 1) {
    const next = predictNext(recursive, method, k)
    futureBaseline.push(round(next))
    recursive.push(next)
  }
  const optimisticRate = Number(options.optimisticRate ?? 5) / 100
  const pessimisticRate = Number(options.pessimisticRate ?? -5) / 100
  const optimistic = futureBaseline.map((value, index) => round(value * (1 + optimisticRate) ** (index + 1)))
  const pessimistic = futureBaseline.map((value, index) => round(value * (1 + pessimisticRate) ** (index + 1)))
  return {
    method: { id: method, ...forecastMethods[method], k: method === 'moving_average' ? k : null },
    splitIndex,
    fitted,
    backtest: {
      actual: values.slice(splitIndex),
      predictions: predictions.map(value => round(value)),
      errors: calculateErrors(values.slice(splitIndex), predictions),
    },
    future: {
      baseline: futureBaseline,
      optimistic,
      pessimistic,
      assumptions: { optimisticRate: round(optimisticRate * 100), pessimisticRate: round(pessimisticRate * 100) },
      isConfidenceInterval: false,
      label: '人为情景假设，不是统计置信区间',
    },
    boundary: '回测只评价所选历史留出期；历史误差较小不保证未来仍然最优。',
  }
}
