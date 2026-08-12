const DEFAULT_VERSION = 1

function resolveStorage(storage) {
  return storage || globalThis.localStorage
}

export function readJsonStorage(key, fallback, options = {}) {
  try {
    const raw = resolveStorage(options.storage).getItem(key)
    if (raw === null || raw === '') return fallback
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.__lmdtStorage === true) {
      return parsed.data ?? fallback
    }
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function readTextStorage(key, fallback = '', options = {}) {
  try {
    return resolveStorage(options.storage).getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeRawStorage(key, rawValue, options = {}) {
  const storage = resolveStorage(options.storage)
  const version = Number(options.version ?? DEFAULT_VERSION)
  try {
    storage.setItem(key, rawValue)
    storage.setItem(`${key}:meta`, JSON.stringify({
      version: Number.isFinite(version) ? version : DEFAULT_VERSION,
      savedAt: new Date().toISOString(),
    }))
    return { ok: true, message: '' }
  } catch (error) {
    const quota = error?.name === 'QuotaExceededError'
    return {
      ok: false,
      error,
      message: quota
        ? '浏览器存储空间不足，请先导出作业数据包并清理旧记录。'
        : '当前浏览器无法保存本地数据，请检查隐私或存储设置。',
    }
  }
}

export function writeJsonStorage(key, value, options = {}) {
  return writeRawStorage(key, JSON.stringify(value), options)
}

export function writeTextStorage(key, value, options = {}) {
  return writeRawStorage(key, String(value ?? ''), options)
}

export function removeJsonStorage(key, options = {}) {
  try {
    const storage = resolveStorage(options.storage)
    storage.removeItem(key)
    storage.removeItem(`${key}:meta`)
    return { ok: true, message: '' }
  } catch (error) {
    return {
      ok: false,
      error,
      message: '当前浏览器无法清理本地数据，请检查隐私或存储设置。',
    }
  }
}
