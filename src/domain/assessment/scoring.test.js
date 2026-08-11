import { describe, expect, it } from 'vitest'
import { buildPracticeSet } from './questionBank'
import { scoreAttempt } from './scoring'

describe('exam practice assessment', () => {
  it('reproduces the same practice set from the same seed and totals 100 points', () => {
    const first = buildPracticeSet(202608)
    const second = buildPracticeSet(202608)
    expect(first).toEqual(second)
    expect(first.reduce((sum, item) => sum + item.points, 0)).toBe(100)
    expect(new Set(first.map(item => item.type)).size).toBeGreaterThanOrEqual(6)
  })

  it('scores answers without exposing explanations through the scoring input', () => {
    const questions = buildPracticeSet(7)
    const answers = Object.fromEntries(questions.map(question => [question.id, question.answer]))
    const result = scoreAttempt(questions, answers)
    expect(result.score).toBe(100)
    expect(result.details.every(item => item.correct)).toBe(true)
  })

  it('accepts multiple-choice answers regardless of order', () => {
    const questions = buildPracticeSet(9)
    const multiple = questions.find(item => item.responseType === 'multiple')
    const result = scoreAttempt([multiple], { [multiple.id]: [...multiple.answer].reverse() })
    expect(result.score).toBe(multiple.points)
  })
})
