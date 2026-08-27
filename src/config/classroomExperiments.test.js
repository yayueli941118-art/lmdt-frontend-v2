import { describe, expect, it } from 'vitest'
import { CLASSROOM_EXPERIMENTS } from './classroomExperiments'

const ids = ['supply', 'enterprise', 'individual', 'migration', 'wage', 'discrimination', 'distribution', 'unemployment', 'aiOccupation', 'tourism']
const taskFields = ['prediction', 'adjustment', 'chart', 'records', 'explanation', 'submission']

describe('classroom experiment contracts', () => {
  it('covers all ten core experiments with executable six-step tasks', () => {
    expect(Object.keys(CLASSROOM_EXPERIMENTS).sort()).toEqual([...ids].sort())
    for (const id of ids) {
      for (const field of taskFields) expect(CLASSROOM_EXPERIMENTS[id].task[field], `${id}.${field}`).toBeTruthy()
    }
  })

  it('provides three parameter-backed teacher presets for every experiment', () => {
    for (const id of ids) {
      const presets = CLASSROOM_EXPERIMENTS[id].presets
      expect(presets, id).toHaveLength(3)
      expect(presets.map(item => item.id)).toEqual(['baseline', 'conflict', 'reality'])
      for (const preset of presets) {
        expect(Object.keys(preset.values).length, `${id}.${preset.id}.values`).toBeGreaterThan(0)
        expect(preset.purpose).toBeTruthy()
        expect(preset.question).toBeTruthy()
        expect(preset.expected).toBeTruthy()
        expect(preset.boundary).toContain('不能')
      }
    }
  })
})
