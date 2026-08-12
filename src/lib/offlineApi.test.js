import { describe, expect, it } from 'vitest'
import { offlineResponse } from './offlineApi'

describe('offline teaching model adapter', () => {
  it('rejects malformed JSON instead of silently running model defaults', () => {
    expect(() => offlineResponse({
      url: '/api/v2/migration/npv',
      data: '{"w_diff":',
    })).toThrow(/请求数据不是有效 JSON/)
  })

  it('returns null only when no offline model implements the route', () => {
    expect(offlineResponse({ url: '/api/v2/not-implemented', data: '{}' })).toBeNull()
  })
})
