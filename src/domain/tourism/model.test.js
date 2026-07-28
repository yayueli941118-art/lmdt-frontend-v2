import { describe, expect, it } from 'vitest'
import { calibrateTourism, simulateTourism } from './model'

function sample(index, overrides = {}) {
  return {
    position: index % 2 ? '活动策划' : '数字营销',
    company: `企业${index}`,
    industry: '文旅与会展',
    city: index % 2 ? '成都' : '重庆',
    salaryMin: 6000 + index * 100,
    salaryMax: 9000 + index * 100,
    skills: '活动策划；新媒体；数据分析',
    platform: index % 2 ? '平台A' : '平台B',
    collectDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    ...overrides,
  }
}

describe('tourism calibration and scenario model', () => {
  it('rejects undersized samples instead of pretending calibration succeeded', () => {
    const result = calibrateTourism([sample(0), sample(1)], { industry: '文旅与会展' })
    expect(result.status).toBe('rejected')
    expect(result.reasons.join('')).toContain('10条')
  })

  it('reports sample coverage and derives explainable calibration parameters', () => {
    const result = calibrateTourism(
      Array.from({ length: 12 }, (_, index) => sample(index)),
      { industry: '文旅与会展' },
    )
    expect(result.status).toBe('ready')
    expect(result.sample_size).toBe(12)
    expect(result.parameters.salary_reference).toBeGreaterThan(0)
    expect(result.model_version).toBeTruthy()
  })

  it('reports relative heat rather than claiming an industry job total', () => {
    const result = simulateTourism({ tourist_growth: 20, digital_level: 70 })
    expect(result.demand.unit).toContain('指数')
    expect(result.conclusion).toContain('热度指数')
    expect(result.attraction).not.toHaveProperty('expected_applicants')
  })
})
