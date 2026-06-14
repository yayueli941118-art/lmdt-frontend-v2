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
  competition: '展示版',
  anonymous: '评审版',
}[appMode]

const common = {
  brandShort: 'LMDT 2.0',
  brandFull: '劳动力市场数字孪生沙盘',
  titleLines: ['劳动力市场', '数字孪生沙盘'],
  heroDesc: '基于劳动经济学核心理论的交互式仿真平台，将贝弗里奇曲线、明瑟方程、CES 生产函数等经典模型转化为可视化、可调控的数字化实验场景',
  moduleCount: '12',
  chapterCount: '9',
  footerVersion: 'v2.0.1 · build 2026.05',
}

export const appProfile = {
  teaching: {
    ...common,
    heroBadge: '西南交通大学希望学院 · 商学院',
    footerSchool: '西南交通大学希望学院 · 商学院',
    footerCourse: '《劳动经济学》核心课程 · 人力资源管理专业',
    footerAuthor: '课程负责人 / 系统设计：黎雅月',
    footerPowered: 'Powered by Vue 3 + FastAPI + GitHub Pages',
  },
  competition: {
    ...common,
    heroBadge: '劳动经济学数字化教学创新展示',
    heroDesc: '围绕“预测—仿真—解释—反思—评价”的教学闭环，将抽象曲线转化为可操作、可观察、可讨论的学习实验',
    footerSchool: '西南交通大学希望学院 · 商学院',
    footerCourse: '《劳动经济学》数字化教学创新案例',
    footerAuthor: '课程负责人 / 系统设计：黎雅月',
    footerPowered: 'Powered by Vue 3 + FastAPI + GitHub Pages',
  },
  anonymous: {
    ...common,
    brandShort: 'LM Simulation',
    heroBadge: '劳动经济学数字化仿真实验平台',
    heroDesc: '围绕劳动供给、需求、人力资本、工资、迁移、失业和收入分配等主题，将抽象经济学模型转化为可交互的仿真实验',
    footerSchool: '匿名评审材料',
    footerCourse: '劳动经济学数字化仿真实验平台',
    footerAuthor: '身份信息已隐藏',
    footerPowered: 'Powered by Vue 3 + FastAPI + GitHub Pages',
  },
}[appMode]

export const showcaseSteps = [
  { title: '教学痛点', desc: '劳动经济学曲线抽象、静态，学生难以把参数变化和经济含义连接起来。' },
  { title: '仿真实验', desc: '通过滑块实时改变工资、资本、技能错配、迁移成本等变量，图表即时反馈。' },
  { title: '模型解释', desc: '系统把曲线变化转化为劳动供给、需求、匹配效率、净现值等可解释指标。' },
  { title: '价值反思', desc: '围绕体面劳动、公平就业、技能提升和共同富裕形成自然讨论。' },
]
