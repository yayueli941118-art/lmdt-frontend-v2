import { describe, expect, it } from 'vitest'

import { auditPracticeSubmission } from './audit'

const versions = Object.freeze({
  template: 'TPL-L02-STUDENT-V1.0',
  dataset: 'DATA-L02-V1.0',
  rules: 'RULE-L02-V1.0',
})

function employedPeople() {
  return Array.from({ length: 36 }, (_, index) => ({
    personId: `P${String(index + 1).padStart(2, '0')}`,
    age: 20 + index,
    paidHours: 1,
    temporarilyAbsent: false,
    absenceEvidence: '',
    activeSearch3m: false,
    available2w: false,
    category: 'E',
    hitRule: 'R-E01',
    rationale: '本周至少有1小时有酬工作，因此判定为就业。',
  }))
}

function employedMetrics() {
  return {
    W: { value: 36, formula: '=COUNTA(A6:A41)' },
    E: { value: 36, formula: '=COUNTIF(L6:L41,"E")' },
    U: { value: 0, formula: '=COUNTIF(L6:L41,"U")' },
    N: { value: 0, formula: '=COUNTIF(L6:L41,"N")' },
    LF: { value: 36, formula: '=E+U' },
    participationRate: { value: 1, formula: '=LF/W' },
    employmentPopulationRatio: { value: 1, formula: '=E/W' },
    unemploymentRate: { value: 0, formula: '=U/LF' },
    identity: { value: 36, formula: '=E+U+N' },
  }
}

function baseSubmission(overrides = {}) {
  return {
    versions,
    student: { className: '人力01', id: '001', name: '测试学生' },
    people: employedPeople(),
    metrics: employedMetrics(),
    ...overrides,
  }
}

function v2Submission(overrides = {}) {
  const people = employedPeople().map(person => ({
    ...person,
    changeReason: '核对人物事实与规则后，保留该分类和命中规则。',
  }))
  return baseSubmission({
    people,
    aiAudit: { used: false, tool: '未使用' },
    report: {
      factualConclusion: '本次单期教学样本中，36人均有至少1小时有酬工作。',
      cautiousExplanation: '这只反映单期教学样本的结构，不能代表真实城市。',
      prohibitedInference: '不能推出趋势、因果、政策效果或就业质量。',
      nextEvidence: '下一步需要补充多期真实抽样数据。',
    },
    ...overrides,
  })
}

describe('实践一机器审计', () => {
  it('版本不匹配时拒绝文件，且不泄露人物正确分类', () => {
    const result = auditPracticeSubmission(baseSubmission({
      versions: { ...versions, template: 'TPL-L02-STUDENT-OLD' },
    }), { phase: 'v1' })

    expect(result.status).toBe('REJECTED')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'FILE_VERSION_ERROR' }),
    ]))
    expect(JSON.stringify(result)).not.toContain('expectedCategory')
  })

  it('人物集合不是 P01-P36 时拒绝文件', () => {
    const result = auditPracticeSubmission(baseSubmission({
      people: [{ personId: 'P01' }, { personId: 'P01' }],
    }), { phase: 'v1' })

    expect(result.status).toBe('REJECTED')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'PERSON_ID_ERROR' }),
    ]))
  })

  it('班级、学号或姓名缺失时拒绝文件', () => {
    const result = auditPracticeSubmission(baseSubmission({
      student: { className: '人力01', id: '', name: '测试学生' },
    }), { phase: 'v1' })

    expect(result.status).toBe('REJECTED')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_STUDENT_INFO' }),
    ]))
  })

  it('V1 有人物未完成分类时返回待补信息', () => {
    const people = employedPeople()
    people[7].category = ''

    const result = auditPracticeSubmission(baseSubmission({ people }), { phase: 'v1' })

    expect(result.status).toBe('NEED_INFO')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REQUIRED', target: 'P08' }),
    ]))
  })

  it('按工作、求职和可到岗事实发现错误分类，但不直接公布答案', () => {
    const people = employedPeople()
    people[23] = {
      ...people[23],
      personId: 'P24',
      paidHours: 0,
      activeSearch3m: true,
      available2w: true,
      category: 'N',
      hitRule: 'R-N01',
      rationale: '目前没有工作，所以归入非劳动力。',
    }

    const result = auditPracticeSubmission(baseSubmission({ people }), { phase: 'v1' })

    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CLASS_MISMATCH', target: 'P24' }),
    ]))
    expect(JSON.stringify(result)).not.toContain('expectedCategory')
  })

  it('分类正确但命中规则错误时单独报告规则问题', () => {
    const people = employedPeople()
    people[23] = {
      ...people[23],
      personId: 'P24',
      paidHours: 0,
      activeSearch3m: true,
      available2w: true,
      category: 'U',
      hitRule: 'R-N01',
      rationale: '近3个月实际求职且未来2周可以到岗。',
    }

    const result = auditPracticeSubmission(baseSubmission({ people }), { phase: 'v1' })

    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'RULE_MISMATCH', target: 'P24' }),
    ]))
  })

  it('数值正确但用硬编码替代公式时不能客观通过', () => {
    const metrics = employedMetrics()
    metrics.unemploymentRate = { value: 0, formula: '' }

    const result = auditPracticeSubmission(baseSubmission({ metrics }), { phase: 'v1' })

    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'FORMULA_NOT_AUDITABLE', target: '失业率' }),
    ]))
  })

  it('人数公式结果与逐人分类不一致时报告 COUNT_MISMATCH', () => {
    const metrics = employedMetrics()
    metrics.E = { ...metrics.E, value: 35 }

    const result = auditPracticeSubmission(baseSubmission({ metrics }), { phase: 'v1' })

    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'COUNT_MISMATCH', target: 'E｜就业人口' }),
    ]))
  })

  it('三项比率使用错误分母时报告 RATE_MISMATCH', () => {
    const metrics = employedMetrics()
    metrics.participationRate = { ...metrics.participationRate, value: 0.75 }

    const result = auditPracticeSubmission(baseSubmission({ metrics }), { phase: 'v1' })

    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'RATE_MISMATCH', target: '劳动参与率' }),
    ]))
  })

  it('V1 一句话依据为空或过短时报告 MISSING_REASON', () => {
    const people = employedPeople()
    people[0].rationale = '有工作'

    const result = auditPracticeSubmission(baseSubmission({ people }), { phase: 'v1' })

    expect(result.status).toBe('V1_NEEDS_REVISION')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REASON', target: 'P01' }),
    ]))
  })

  it('暂未上班但缺少岗位保留或返岗证据时停止强判', () => {
    const people = employedPeople()
    people[3] = {
      ...people[3],
      personId: 'P04',
      paidHours: 0,
      temporarilyAbsent: true,
      absenceEvidence: '',
      category: 'E',
      hitRule: 'R-E02',
    }

    const result = auditPracticeSubmission(baseSubmission({ people }), { phase: 'v1' })

    expect(result.status).toBe('NEED_INFO')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'TEMP_ABSENCE_EVIDENCE_MISSING', target: 'P04' }),
    ]))
  })

  it('V2 客观结果正确但缺少修改或保留理由时进入教师复核', () => {
    const submission = v2Submission()
    submission.people[11].changeReason = ''

    const result = auditPracticeSubmission(submission, { phase: 'v2' })

    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CHANGE_REASON_MISSING', target: 'P12' }),
    ]))
  })

  it('V2 声明使用AI但未保留原回答时报告 AI_TRACE_MISSING', () => {
    const submission = v2Submission({
      aiAudit: { used: true, tool: '某AI工具', prompt: '请审核分类', originalText: '', records: [] },
    })

    const result = auditPracticeSubmission(submission, { phase: 'v2' })

    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AI_TRACE_MISSING', target: 'AI审计' }),
    ]))
  })

  it('V2 保留了AI原回答但没有逐条判断和依据时报告 AI_AUDIT_INCOMPLETE', () => {
    const submission = v2Submission({
      aiAudit: {
        used: true,
        tool: '某AI工具',
        prompt: '请审核分类',
        originalText: 'AI建议将全部没有工作的人都归入失业。',
        records: [{ judgment: '', basis: '' }],
      },
    })

    const result = auditPracticeSubmission(submission, { phase: 'v2' })

    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AI_AUDIT_INCOMPLETE', target: 'AI审计' }),
    ]))
  })

  it('V2 把单期数据写成趋势或因果时只提示边界风险并转教师复核', () => {
    const submission = v2Submission({
      report: {
        factualConclusion: '就业率明显上升。',
        cautiousExplanation: '政策导致了就业改善。',
        prohibitedInference: '',
        nextEvidence: '无需补充数据。',
      },
    })

    const result = auditPracticeSubmission(submission, { phase: 'v2' })

    expect(result.status).toBe('TEACHER_REVIEW')
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'REPORT_BOUNDARY_RISK', target: '领导汇报' }),
    ]))
  })

  it('完整且客观正确的 V1 返回 OBJECTIVE_PASS', () => {
    const result = auditPracticeSubmission(baseSubmission(), { phase: 'v1' })

    expect(result.status).toBe('OBJECTIVE_PASS')
    expect(result.findings).toEqual([])
  })

  it('客观正确且学习审计完整的 V2 返回 AUDIT_READY', () => {
    const result = auditPracticeSubmission(v2Submission(), { phase: 'v2' })

    expect(result.status).toBe('AUDIT_READY')
    expect(result.findings).toEqual([])
  })
})
