import { describe, expect, it } from 'vitest'
import { analyzeOccupationTasks, occupationTemplates } from './model'

describe('AI occupation task analysis', () => {
  it('normalizes task time and reports four transparent shares', () => {
    const result = analyzeOccupationTasks(occupationTemplates['人力资源专员'], {})
    const total = result.shares.automation + result.shares.augmentation + result.shares.human + result.shares.newTask
    expect(total).toBeCloseTo(100, 1)
    expect(result.exposureIndex).toBeGreaterThan(0)
    expect(result.boundary).toContain('教学情景')
  })

  it('allows scale and complement effects to offset substitution', () => {
    const result = analyzeOccupationTasks(occupationTemplates['人力资源专员'], {
      baselineEmployment: 100,
      taskSubstitution: 45,
      aiProductivity: 70,
      demandExpansion: 80,
      complementarity: 85,
      trainingInvestment: 80,
    })
    expect(result.effects.substitution).toBeLessThan(0)
    expect(result.effects.scale).toBeGreaterThan(0)
    expect(result.effects.complement).toBeGreaterThan(0)
    expect(result.longTermEmployment).toBeGreaterThan(result.shortTermEmployment)
  })
})
