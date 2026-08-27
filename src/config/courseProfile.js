export const COURSE_PROFILE = Object.freeze({
  profileVersion: 'V0.5',
  effectiveDate: '2026-08-26',
  code: '2132036',
  name: '劳动力市场分析与预测',
  englishName: 'Labor Market Analysis and Forecasting',
  credits: 2,
  nature: '专业选修课',
  audience: '人力资源管理专业',
  semester: '第5学期',
  language: '中文',
  assessmentType: '考查',
  hours: Object.freeze({ total: 32, theory: 16, practice: 16 }),
  assessments: Object.freeze([
    Object.freeze({ id: 'AS-01', label: '课堂实践与过程证据', weight: 10, evidence: '八次实践任务、操作轨迹、Exit Ticket与修订记录' }),
    Object.freeze({ id: 'AS-02', label: '个人实践档案', weight: 30, evidence: '四件个人代表作品及V1—反馈—V2证据' }),
    Object.freeze({ id: 'AS-03', label: '小组综合项目', weight: 30, evidence: '可复核分析文件、预测结果、决策简报、答辩与个人贡献' }),
    Object.freeze({ id: 'AS-04', label: '个人综合实践考查', weight: 30, evidence: '新数据新情境下的独立分析、预测、AI审计与决策简报' }),
  ]),
  learningLine: Object.freeze(['看市场', '拆机制', '推未来', '做决策', '验能力']),
  practiceLessons: Object.freeze([
    '新城市劳动力市场指标诊断',
    '劳动参与与群体差异分析',
    '劳动需求弹性与技术冲击仿真',
    '岗位错配诊断与政策建议',
    '教育培训回报与职业任务分析',
    '工资差距与算法公平审计',
    '劳动力市场数据分析与预测综合项目',
    '个人综合实践考查',
  ]),
  goals: Object.freeze([
    '完成劳动力市场数据的采集核验、清洗整合、标准化与指标计算，并判断数据质量和适用范围。',
    '运用劳动经济学理论解释劳动供给、需求、工资、失业、人力资本、流动及市场差异。',
    '运用数据分析与基础预测方法开展短期预测和供给情景分析，并评价误差、假设与不确定性。',
    '综合指标、理论、预测和情景证据，审计数字化及生成式人工智能风险并形成决策建议。',
  ]),
  source: Object.freeze({
    outline: '2132036-《劳动力市场分析与预测》教学大纲-V0.5考查制审校版-2026年8月26日.doc',
    courseOs: '《劳动力市场分析与预测》课程OS V0.5更新报告（2026-08-26）',
    boundary: '正式大纲确定课程行政口径；课程OS补充16次课、八次实践与课堂任务。',
  }),
})

export const COURSE_ASSESSMENT_TOTAL = COURSE_PROFILE.assessments
  .reduce((total, item) => total + item.weight, 0)

export function courseProfileForMode(mode) {
  return {
    course: COURSE_PROFILE,
    showIdentity: mode !== 'anonymous',
    mode,
  }
}
