import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('教学组件契约', () => {
  it('实验记录组件包含完整闭环字段和本地存储键', () => {
    const source = readFileSync(new URL('./ExperimentRecordPanel.vue', import.meta.url), 'utf8')
    for (const field of [
      'initialPrediction',
      'initialReason',
      'baselineResult',
      'counterfactualResult',
      'studentExplanation',
      'ruleFeedback',
      'revisedExplanation',
      'modelVersion',
      'dataSourceType',
    ]) {
      expect(source).toContain(field)
    }
    expect(source).toContain('lmdtReportExperimentRecords')
  })

  it('学习任务卡明确呈现预测到修改的步骤', () => {
    const source = readFileSync(new URL('./LearningTaskCard.vue', import.meta.url), 'utf8')
    for (const label of ['先预测', '调参数', '看证据', '做解释', '再修改']) {
      expect(source).toContain(label)
    }
  })

  it('统一实验容器向学生显示计算错误而不是保留旧结果', () => {
    const source = readFileSync(new URL('./ExperimentWorkspace.vue', import.meta.url), 'utf8')
    expect(source).toContain("error: { type: String")
    expect(source).toContain('role="alert"')
  })

  it('AI岗位实验保存与报告工作台兼容的记录结构', () => {
    const source = readFileSync(new URL('../views/AiOccupationLab.vue', import.meta.url), 'utf8')
    for (const field of ['parameters:', 'modelVersion:', 'dataSourceType:', 'initialPrediction:']) {
      expect(source).toContain(field)
    }
    expect(source).not.toContain('params: { 岗位:')
  })
})
