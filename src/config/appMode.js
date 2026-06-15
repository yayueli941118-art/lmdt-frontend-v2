const MODES = new Set(['teaching', 'competition', 'anonymous'])

function readModeFromUrl() {
  const searchMode = new URLSearchParams(window.location.search).get('mode')
  const hashQuery = window.location.hash.includes('?') ? window.location.hash.slice(window.location.hash.indexOf('?') + 1) : ''
  const hashMode = new URLSearchParams(hashQuery).get('mode')
  const mode = hashMode || searchMode || 'teaching'
  return MODES.has(mode) ? mode : 'teaching'
}

export const appMode = readModeFromUrl()
export const isCompetition = appMode === 'competition'
export const isAnonymous = appMode === 'anonymous'

export const modeLabel = {
  teaching: '',
  competition: '竞赛版',
  anonymous: '匿名版',
}[appMode]

const common = {
  brandShort: 'LMDT 2.0',
  brandFull: '劳动力市场数字孪生沙盘',
  titleLines: ['劳动力市场', '数字孪生沙盘'],
  heroDesc: '把劳动经济学教材中的曲线、均衡点和参数变化做成可操作的实验。你可以调节变量、观察图形移动，并把结果写入课程报告。',
  moduleCount: '12',
  chapterCount: '9',
  footerVersion: 'v2.0.1 · build 2026.05',
  footerPowered: 'Powered by Vue 3 + ECharts + GitHub Pages',
}

export const appProfile = {
  teaching: {
    ...common,
    heroBadge: '劳动经济学课程实验',
    footerSchool: '西南交通大学希望学院 · 商学院',
    footerCourse: '《劳动经济学》核心课程 · 人力资源管理专业',
    footerAuthor: '课程负责人 / 系统设计：黎雅月',
    labIdentity: '劳动经济学课程实验',
  },
  competition: {
    ...common,
    heroBadge: '课程展示模式',
    heroDesc: '围绕“预测—仿真—解释—反思—评价”的学习闭环，将抽象曲线转化为学生可操作、可观察、可讨论的课程实验。',
    footerSchool: '西南交通大学希望学院 · 商学院',
    footerCourse: '《劳动经济学》课程实验系统',
    footerAuthor: '课程负责人 / 系统设计：黎雅月',
    labIdentity: '课程展示模式 · 可操作实验',
  },
  anonymous: {
    ...common,
    brandShort: 'LM Simulation',
    heroBadge: '匿名展示模式',
    heroDesc: '围绕劳动供给、需求、人力资本、工资、迁移、失业和收入分配等主题，将抽象经济学模型转化为学生可交互的课程实验。',
    footerSchool: '课程教学单位（匿名）',
    footerCourse: '劳动经济学课程实验系统',
    footerAuthor: '作者信息已隐藏',
    labIdentity: '匿名展示模式 · 可操作实验',
  },
}[appMode]

export const showcaseSteps = [
  { title: '学习难点', desc: '劳动经济学曲线抽象、静态，参数变化和经济含义不容易同时看清。' },
  { title: '动手实验', desc: '通过滑块改变工资、资本、技能错配、迁移成本等变量，图表即时反馈。' },
  { title: '模型解释', desc: '系统把曲线变化转化为劳动供给、需求、匹配效率、净现值等可解释指标。' },
  { title: '价值思考', desc: '围绕体面劳动、公平就业、技能提升和共同富裕形成自然讨论。' },
]
