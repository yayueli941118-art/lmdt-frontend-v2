export function finiteNumber(value, fallback, label = '参数') {
  const parsed = Number(value ?? fallback)
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${label}必须是有效数字。`)
  }
  return parsed
}

export function boundedNumber(value, fallback, min, max, label = '参数') {
  const parsed = finiteNumber(value, fallback, label)
  return Math.min(max, Math.max(min, parsed))
}

export function nonNegativeNumber(value, fallback, label = '参数') {
  return Math.max(finiteNumber(value, fallback, label), 0)
}
