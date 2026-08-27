import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COURSE_ASSESSMENT_TOTAL, COURSE_PROFILE, courseProfileForMode } from './courseProfile'

describe('V0.5 course profile', () => {
  it('uses the verified hours and assessment structure', () => {
    expect(COURSE_PROFILE.hours).toEqual({ total: 32, theory: 16, practice: 16 })
    expect(COURSE_PROFILE.hours.theory + COURSE_PROFILE.hours.practice).toBe(COURSE_PROFILE.hours.total)
    expect(COURSE_PROFILE.assessmentType).toBe('考查')
    expect(COURSE_PROFILE.assessments.map(item => item.weight)).toEqual([10, 30, 30, 30])
    expect(COURSE_ASSESSMENT_TOTAL).toBe(100)
  })

  it('provides the same frozen course object to all three modes', () => {
    const profiles = ['teaching', 'competition', 'anonymous'].map(courseProfileForMode)
    expect(profiles.every(profile => profile.course === COURSE_PROFILE)).toBe(true)
    expect(profiles.at(-1).showIdentity).toBe(false)
  })

  it('removes the obsolete assessment copy from active pages and methodology', () => {
    const files = [
      new URL('../views/Home.vue', import.meta.url),
      new URL('../views/ExamPractice.vue', import.meta.url),
      new URL('../../docs/lmdt-3-methodology.md', import.meta.url),
    ]
    const content = files.map(file => readFileSync(file, 'utf8')).join('\n')
    for (const obsolete of ['个体作业10%', '小组作业20%', '期末考试60%', '考勤与过程10分']) {
      expect(content).not.toContain(obsolete)
    }
  })
})
