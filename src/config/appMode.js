import { RELEASE_LABEL } from './release'
import { COURSE_PROFILE } from './courseProfile'

const MODES = new Set(['teaching', 'competition', 'anonymous'])

function readModeFromUrl() {
  const searchMode = new URLSearchParams(window.location.search).get('mode')
  const hashQuery = window.location.hash.includes('?') ? window.location.hash.slice(window.location.hash.indexOf('?') + 1) : ''
  const hashMode = new URLSearchParams(hashQuery).get('mode')
  const mode = hashMode || searchMode || 'teaching'
  return MODES.has(mode) ? mode : 'teaching'
}

export const appMode = __ANONYMOUS_BUILD__ ? 'anonymous' : readModeFromUrl()
export const isCompetition = appMode === 'competition'
export const isAnonymous = appMode === 'anonymous'

export const modeLabel = {
  teaching: '',
  competition: '竞赛版',
  anonymous: '匿名版',
}[appMode]

const sharedProfile = {
  course: COURSE_PROFILE,
  brandFull: 'AI劳动力市场分析、机制仿真与预测实验室',
  titleLines: ['劳动力市场分析与预测', '数据、机制、预测与能力训练'],
  heroDesc: '从数据质量检查出发，连接劳动经济学机制实验、基础预测、AI岗位影响分析和独立能力训练。',
  moduleCount: '16',
  chapterCount: '9',
  footerVersion: `${RELEASE_LABEL} · build 2026.08`,
  footerPowered: 'Powered by Vue 3 + ECharts + GitHub Pages',
}

const anonymousProfile = {
  ...sharedProfile,
  auditSystemLabel: '核验系统',
  brandShort: 'Labor Market Lab',
  brandFull: 'Labor Market Analysis & Forecast Lab',
  heroBadge: '课程实验系统',
  heroDesc: '围绕市场数据、劳动经济学机制、基础预测和AI岗位任务重构，形成可操作、可解释、可复核的学习过程。',
  footerSchool: '课程教学单位（匿名）',
  footerCourse: '《劳动力市场分析与预测》课程实验系统',
  footerAuthor: '作者信息已隐藏',
  labIdentity: '课程实验 · 数据与机制分析',
}

const namedProfiles = __ANONYMOUS_BUILD__ ? null : {
  teaching: {
    ...sharedProfile,
    auditSystemLabel: 'LMDT',
    brandShort: 'LMDT 3.0',
    heroBadge: '《劳动力市场分析与预测》课程实验',
    footerSchool: '西南交通大学希望学院 · 商学院',
    footerCourse: '《劳动力市场分析与预测》课程 · 人力资源管理专业',
    footerAuthor: '课程负责人 / 系统设计：黎雅月',
    labIdentity: '劳动力市场分析与预测课程实验',
  },
  competition: {
    ...sharedProfile,
    auditSystemLabel: 'LMDT',
    brandShort: 'LMDT 3.0',
    heroBadge: '课程教学展示',
    heroDesc: '以“看市场—拆机制—推未来—做决策—验能力”为主线，展示数据证据、机制解释、预测回测和学习评价。',
    footerSchool: '西南交通大学希望学院 · 商学院',
    footerCourse: '《劳动力市场分析与预测》课程实验系统',
    footerAuthor: '课程负责人 / 系统设计：黎雅月',
    labIdentity: '课程展示模式 · 可操作实验',
  },
}

export const appProfile = isAnonymous ? anonymousProfile : namedProfiles[appMode]

export const showcaseSteps = [
  { title: '看市场', desc: '导入数据，先核查来源、日期、单位、缺失值和指标口径。' },
  { title: '拆机制', desc: '用教材曲线解释供给、需求、工资、匹配和收入分配变化。' },
  { title: '推未来', desc: '先独立判断，再用基础方法回测并比较情景假设。' },
  { title: '做决策', desc: '把样本统计、实验记录和预测边界写入课程报告。' },
  { title: '验能力', desc: '通过固定蓝图训练概念、计算、图表、预测和AI错误识别。' },
]
