export const L02_VERSIONS = Object.freeze({
  template: 'TPL-L02-STUDENT-V1.0',
  dataset: 'DATA-L02-V1.0',
  rules: 'RULE-L02-V1.0',
})

const VERSION_FEEDBACK = Object.freeze({
  code: 'FILE_VERSION_ERROR',
  level: '文件',
  severity: 'BLOCKER',
  message: '文件版本不匹配，请重新下载实践一正式模板。',
  nextStep: '换用学习通发布的 V1.0 模板，不要复制旧表。',
})

const EXPECTED_PERSON_IDS = Object.freeze(
  Array.from({ length: 36 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`),
)

const PERSON_ID_FEEDBACK = Object.freeze({
  code: 'PERSON_ID_ERROR',
  level: '结构',
  severity: 'BLOCKER',
  message: '人物ID存在缺失、重复、增删或顺序异常。',
  nextStep: '恢复 P01-P36，不要排序、删除或新增人物。',
})

const STUDENT_INFO_FEEDBACK = Object.freeze({
  code: 'MISSING_STUDENT_INFO',
  level: '文件',
  severity: 'BLOCKER',
  message: '班级、学号或姓名缺失。',
  nextStep: '在“00_使用说明”补齐班级、学号和姓名。',
})

const MISSING_REQUIRED_FEEDBACK = Object.freeze({
  code: 'MISSING_REQUIRED',
  level: '结构',
  severity: 'BLOCKER',
  message: '人物的必填事实、分类或枚举值缺失。',
  nextStep: '补齐黄色必填单元格后重新上传。',
})

const CLASS_MISMATCH_FEEDBACK = Object.freeze({
  code: 'CLASS_MISMATCH',
  level: '分类',
  severity: 'ERROR',
  message: '该人物的 E/U/N 分类与结构化事实不一致。',
  nextStep: '按“有酬工作→暂未上班→实际求职→两周可到岗”的顺序复核。',
})

const RULE_MISMATCH_FEEDBACK = Object.freeze({
  code: 'RULE_MISMATCH',
  level: '分类',
  severity: 'ERROR',
  message: '分类结果与命中规则不一致。',
  nextStep: '复核规则编号，并让一句话依据与规则保持一致。',
})

const METRIC_LABELS = Object.freeze({
  W: 'W｜本课统计范围人口',
  E: 'E｜就业人口',
  U: 'U｜失业人口',
  N: 'N｜非劳动力',
  LF: 'LF｜劳动力',
  participationRate: '劳动参与率',
  employmentPopulationRatio: '就业人口比',
  unemploymentRate: '失业率',
  identity: '集合恒等校验',
})

const FORMULA_NOT_AUDITABLE_FEEDBACK = Object.freeze({
  code: 'FORMULA_NOT_AUDITABLE',
  level: '指标',
  severity: 'WARN',
  message: '该指标使用硬编码数值，计算过程不可复核。',
  nextStep: '改为引用分类区域或指标单元格的 Excel 公式。',
})

const COUNT_MISMATCH_FEEDBACK = Object.freeze({
  code: 'COUNT_MISMATCH',
  level: '指标',
  severity: 'ERROR',
  message: '人数或集合恒等式与逐人分类结果不一致。',
  nextStep: '检查分类引用范围、COUNTIF 条件和 LF=E+U、E+U+N=W。',
})

const RATE_MISMATCH_FEEDBACK = Object.freeze({
  code: 'RATE_MISMATCH',
  level: '指标',
  severity: 'ERROR',
  message: '比率公式结果与分类人数不一致。',
  nextStep: '检查劳动参与率 LF/W、就业人口比 E/W、失业率 U/LF。',
})

const MISSING_REASON_FEEDBACK = Object.freeze({
  code: 'MISSING_REASON',
  level: '证据',
  severity: 'WARN',
  message: '一句话依据为空或过短，无法看出判断所依据的时间窗口。',
  nextStep: '至少用10个字符写明工作、求职或可到岗事实。',
})

const TEMP_ABSENCE_EVIDENCE_FEEDBACK = Object.freeze({
  code: 'TEMP_ABSENCE_EVIDENCE_MISSING',
  level: '结构',
  severity: 'BLOCKER',
  message: '暂未上班，但岗位保留、离岗性质或返岗事实不足。',
  nextStep: '补充岗位保留、离岗性质或返岗事实后重传。',
})

const CHANGE_REASON_FEEDBACK = Object.freeze({
  code: 'CHANGE_REASON_MISSING',
  level: 'V2',
  severity: 'WARN',
  message: 'V2 的修改或保留没有说明理由。',
  nextStep: '写明依据什么人物事实、系统反馈或AI审计作出决定。',
})

const AI_TRACE_FEEDBACK = Object.freeze({
  code: 'AI_TRACE_MISSING',
  level: 'AI',
  severity: 'WARN',
  message: '已声明使用AI，但没有保留AI原回答或忠实摘要。',
  nextStep: '补充AI工具、主要提示词和原回答或忠实摘要。',
})

const AI_AUDIT_FEEDBACK = Object.freeze({
  code: 'AI_AUDIT_INCOMPLETE',
  level: 'AI',
  severity: 'WARN',
  message: 'AI建议尚未完成接受、修改或拒绝的专业审计。',
  nextStep: '至少逐条记录一个判断，并写出人物事实、公式或边界依据。',
})

const REPORT_BOUNDARY_FEEDBACK = Object.freeze({
  code: 'REPORT_BOUNDARY_RISK',
  level: '报告',
  severity: 'WARN',
  message: '单期教学数据中出现趋势、因果或确定性政策措辞。',
  nextStep: '改写为单期结构事实，并补充需要何种多期或外部证据。',
})

const REPORT_RISK_PATTERN = /上升|下降|改善|恶化|增长|减少|导致|造成|证明|政策有效|必然|确定/

function versionsMatch(versions = {}) {
  return Object.entries(L02_VERSIONS)
    .every(([key, expected]) => versions[key] === expected)
}

function personIdsMatch(people = []) {
  return people.length === EXPECTED_PERSON_IDS.length
    && people.every((person, index) => person?.personId === EXPECTED_PERSON_IDS[index])
}

function studentInfoComplete(student = {}) {
  return ['className', 'id', 'name']
    .every(key => String(student[key] || '').trim())
}

function classificationFromFacts(person) {
  if (Number(person.paidHours) >= 1) return { category: 'E', ruleId: 'R-E01' }
  if (person.temporarilyAbsent && String(person.absenceEvidence || '').trim()) {
    return { category: 'E', ruleId: 'R-E02' }
  }
  if (person.activeSearch3m && person.available2w) return { category: 'U', ruleId: 'R-U01' }
  if (person.activeSearch3m && !person.available2w) return { category: 'N', ruleId: 'R-N02' }
  return { category: 'N', ruleId: 'R-N01' }
}

function metricExpectations(people) {
  const W = people.length
  const E = people.filter(person => person.category === 'E').length
  const U = people.filter(person => person.category === 'U').length
  const N = people.filter(person => person.category === 'N').length
  const LF = E + U
  return { W, E, U, N, LF, identity: E + U + N }
}

function rateExpectations(counts) {
  return {
    participationRate: counts.W ? counts.LF / counts.W : null,
    employmentPopulationRatio: counts.W ? counts.E / counts.W : null,
    unemploymentRate: counts.LF ? counts.U / counts.LF : null,
  }
}

function numbersClose(actual, expected, tolerance = 0.000001) {
  return Number.isFinite(Number(actual))
    && Number.isFinite(Number(expected))
    && Math.abs(Number(actual) - Number(expected)) <= tolerance
}

export function auditPracticeSubmission(submission = {}, { phase = 'v1' } = {}) {
  if (!versionsMatch(submission.versions)) {
    return {
      phase,
      status: 'REJECTED',
      findings: [{ ...VERSION_FEEDBACK }],
      summary: { blockers: 1, errors: 0, warnings: 0 },
    }
  }


  if (!studentInfoComplete(submission.student)) {
    return {
      phase,
      status: 'REJECTED',
      findings: [{ ...STUDENT_INFO_FEEDBACK }],
      summary: { blockers: 1, errors: 0, warnings: 0 },
    }
  }


  if (!personIdsMatch(submission.people)) {
    return {
      phase,
      status: 'REJECTED',
      findings: [{ ...PERSON_ID_FEEDBACK }],
      summary: { blockers: 1, errors: 0, warnings: 0 },
    }
  }


  const missingClassifications = submission.people
    .filter(person => !['E', 'U', 'N'].includes(person.category))
    .map(person => ({ ...MISSING_REQUIRED_FEEDBACK, target: person.personId }))

  if (missingClassifications.length) {
    return {
      phase,
      status: 'NEED_INFO',
      findings: missingClassifications,
      summary: { blockers: missingClassifications.length, errors: 0, warnings: 0 },
    }
  }


  const absenceEvidenceFindings = submission.people.flatMap(person => {
    const needsEvidence = Number(person.paidHours) === 0 && person.temporarilyAbsent
    if (!needsEvidence || String(person.absenceEvidence || '').trim()) return []
    return [{ ...TEMP_ABSENCE_EVIDENCE_FEEDBACK, target: person.personId }]
  })

  if (absenceEvidenceFindings.length) {
    return {
      phase,
      status: 'NEED_INFO',
      findings: absenceEvidenceFindings,
      summary: { blockers: absenceEvidenceFindings.length, errors: 0, warnings: 0 },
    }
  }


  const classificationFindings = submission.people.flatMap(person => {
    const expected = classificationFromFacts(person)
    if (person.category === expected.category) return []
    return [{ ...CLASS_MISMATCH_FEEDBACK, target: person.personId }]
  })

  if (classificationFindings.length) {
    return {
      phase,
      status: 'V1_NEEDS_REVISION',
      findings: classificationFindings,
      summary: { blockers: 0, errors: classificationFindings.length, warnings: 0 },
    }
  }


  const ruleFindings = submission.people.flatMap(person => {
    const expected = classificationFromFacts(person)
    if (person.hitRule === expected.ruleId) return []
    return [{ ...RULE_MISMATCH_FEEDBACK, target: person.personId }]
  })

  if (ruleFindings.length) {
    return {
      phase,
      status: 'V1_NEEDS_REVISION',
      findings: ruleFindings,
      summary: { blockers: 0, errors: ruleFindings.length, warnings: 0 },
    }
  }


  const rationaleFindings = phase === 'v1'
    ? submission.people.flatMap(person => {
        if (String(person.rationale || '').trim().length >= 10) return []
        return [{ ...MISSING_REASON_FEEDBACK, target: person.personId }]
      })
    : []

  if (rationaleFindings.length) {
    return {
      phase,
      status: 'V1_NEEDS_REVISION',
      findings: rationaleFindings,
      summary: { blockers: 0, errors: 0, warnings: rationaleFindings.length },
    }
  }


  const formulaFindings = Object.entries(METRIC_LABELS).flatMap(([key, label]) => {
    if (String(submission.metrics?.[key]?.formula || '').trim()) return []
    return [{ ...FORMULA_NOT_AUDITABLE_FEEDBACK, target: label }]
  })

  if (formulaFindings.length) {
    return {
      phase,
      status: 'V1_NEEDS_REVISION',
      findings: formulaFindings,
      summary: { blockers: 0, errors: 0, warnings: formulaFindings.length },
    }
  }


  const expectedCounts = metricExpectations(submission.people)
  const countFindings = Object.entries(expectedCounts).flatMap(([key, expected]) => {
    if (Number(submission.metrics?.[key]?.value) === expected) return []
    return [{ ...COUNT_MISMATCH_FEEDBACK, target: METRIC_LABELS[key] }]
  })

  if (countFindings.length) {
    return {
      phase,
      status: 'V1_NEEDS_REVISION',
      findings: countFindings,
      summary: { blockers: 0, errors: countFindings.length, warnings: 0 },
    }
  }


  const expectedRates = rateExpectations(expectedCounts)
  const rateFindings = Object.entries(expectedRates).flatMap(([key, expected]) => {
    if (numbersClose(submission.metrics?.[key]?.value, expected)) return []
    return [{ ...RATE_MISMATCH_FEEDBACK, target: METRIC_LABELS[key] }]
  })

  if (rateFindings.length) {
    return {
      phase,
      status: 'V1_NEEDS_REVISION',
      findings: rateFindings,
      summary: { blockers: 0, errors: rateFindings.length, warnings: 0 },
    }
  }


  if (phase === 'v2') {
    const changeReasonFindings = submission.people.flatMap(person => {
      if (String(person.changeReason || '').trim().length >= 10) return []
      return [{ ...CHANGE_REASON_FEEDBACK, target: person.personId }]
    })
    if (changeReasonFindings.length) {
      return {
        phase,
        status: 'TEACHER_REVIEW',
        findings: changeReasonFindings,
        summary: { blockers: 0, errors: 0, warnings: changeReasonFindings.length },
      }
    }

    if (submission.aiAudit?.used && String(submission.aiAudit.originalText || '').trim().length < 10) {
      return {
        phase,
        status: 'TEACHER_REVIEW',
        findings: [{ ...AI_TRACE_FEEDBACK, target: 'AI审计' }],
        summary: { blockers: 0, errors: 0, warnings: 1 },
      }
    }

    if (submission.aiAudit?.used) {
      const hasCompleteAudit = (submission.aiAudit.records || []).some(record => (
        ['接受', '修改', '拒绝'].includes(record?.judgment)
        && String(record?.basis || '').trim().length >= 10
      ))
      if (!hasCompleteAudit) {
        return {
          phase,
          status: 'TEACHER_REVIEW',
          findings: [{ ...AI_AUDIT_FEEDBACK, target: 'AI审计' }],
          summary: { blockers: 0, errors: 0, warnings: 1 },
        }
      }
    }

    const reportClaims = [
      submission.report?.factualConclusion,
      submission.report?.cautiousExplanation,
    ].filter(Boolean).join(' ')
    if (REPORT_RISK_PATTERN.test(reportClaims)) {
      return {
        phase,
        status: 'TEACHER_REVIEW',
        findings: [{ ...REPORT_BOUNDARY_FEEDBACK, target: '领导汇报' }],
        summary: { blockers: 0, errors: 0, warnings: 1 },
      }
    }
  }

  return {
    phase,
    status: phase === 'v2' ? 'AUDIT_READY' : 'OBJECTIVE_PASS',
    findings: [],
    summary: { blockers: 0, errors: 0, warnings: 0 },
  }
}
