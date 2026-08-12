import { describe, expect, it } from 'vitest'
import {
  readJsonStorage,
  readTextStorage,
  removeJsonStorage,
  writeJsonStorage,
  writeTextStorage,
} from './storage'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    values,
  }
}

describe('local teaching data storage adapter', () => {
  it('reads legacy JSON and writes schema metadata without changing the stored data shape', () => {
    const storage = memoryStorage({ records: JSON.stringify([{ id: 1 }]) })
    expect(readJsonStorage('records', [], { storage })).toEqual([{ id: 1 }])

    const outcome = writeJsonStorage('records', [{ id: 2 }], { storage, version: 3 })
    expect(outcome.ok).toBe(true)
    expect(JSON.parse(storage.getItem('records'))).toEqual([{ id: 2 }])
    expect(JSON.parse(storage.getItem('records:meta')).version).toBe(3)
  })

  it('returns a visible failure result when browser storage is full', () => {
    const storage = memoryStorage()
    storage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError') }
    const outcome = writeJsonStorage('records', [{ id: 1 }], { storage })
    expect(outcome.ok).toBe(false)
    expect(outcome.message).toContain('存储空间不足')
  })

  it('preserves plain-text report drafts', () => {
    const storage = memoryStorage()
    expect(writeTextStorage('report', '# 报告', { storage }).ok).toBe(true)
    expect(readTextStorage('report', '', { storage })).toBe('# 报告')
  })

  it('reports a visible failure when local data cannot be removed', () => {
    const storage = {
      removeItem() {
        throw new DOMException('blocked', 'SecurityError')
      },
    }

    const outcome = removeJsonStorage('records', { storage })

    expect(outcome.ok).toBe(false)
    expect(outcome.message).toContain('无法清理')
  })
})
