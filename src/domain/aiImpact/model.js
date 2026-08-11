const round = (value, digits = 1) => Number(Number(value).toFixed(digits))
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0))

const hrTasks = [
  ['整理员工与候选人信息', 10, 82, 'automation', 72, 58],
  ['生成招聘信息初稿', 8, 75, 'augmentation', 78, 60],
  ['简历初步筛选', 12, 78, 'automation', 80, 62],
  ['结构化面试准备', 8, 62, 'augmentation', 76, 57],
  ['面试与候选人沟通', 14, 35, 'human', 88, 72],
  ['劳动关系与合规判断', 10, 42, 'human', 90, 66],
  ['薪酬数据分析', 10, 70, 'augmentation', 84, 55],
  ['培训需求诊断', 8, 55, 'human', 82, 61],
  ['组织协同与冲突处理', 12, 28, 'human', 92, 70],
  ['AI工具治理与输出核查', 8, 65, 'newTask', 86, 48],
]

function taskTemplate(rows) {
  return rows.map(([name, timeShare, exposure, category, skillDemand, skillSupply], index) => ({
    id: `task-${index + 1}`, name, timeShare, exposure, category, skillDemand, skillSupply,
  }))
}

export const occupationTemplates = {
  人力资源专员: taskTemplate(hrTasks),
  文旅活动策划: taskTemplate([
    ['活动资料搜集', 9, 78, 'automation', 68, 58], ['方案初稿与排期', 11, 70, 'augmentation', 82, 61],
    ['供应商沟通', 10, 32, 'human', 84, 70], ['现场统筹', 16, 22, 'human', 92, 74],
    ['新媒体内容制作', 12, 76, 'augmentation', 85, 64], ['游客数据分析', 10, 72, 'augmentation', 88, 55],
    ['安全与应急判断', 10, 18, 'human', 96, 73], ['地方文化叙事', 8, 38, 'human', 90, 68],
    ['数字人/智能导览设计', 7, 68, 'newTask', 84, 46], ['效果评估与复盘', 7, 55, 'augmentation', 80, 59],
  ]),
}

export function analyzeOccupationTasks(inputTasks = [], parameters = {}) {
  const tasks = inputTasks.map((task, index) => ({
    id: task.id || `task-${index + 1}`,
    name: String(task.name || `任务${index + 1}`),
    timeShare: clamp(task.timeShare), exposure: clamp(task.exposure),
    category: ['automation', 'augmentation', 'human', 'newTask'].includes(task.category) ? task.category : 'human',
    skillDemand: clamp(task.skillDemand ?? 70), skillSupply: clamp(task.skillSupply ?? 60),
  }))
  const timeTotal = tasks.reduce((sum, task) => sum + task.timeShare, 0) || 1
  const normalized = tasks.map(task => ({ ...task, normalizedShare: task.timeShare / timeTotal * 100 }))
  const shareOf = category => normalized.filter(task => task.category === category)
    .reduce((sum, task) => sum + task.normalizedShare, 0)
  const shares = {
    automation: round(shareOf('automation')),
    augmentation: round(shareOf('augmentation')),
    human: round(shareOf('human')),
    newTask: round(shareOf('newTask')),
  }
  const exposureIndex = round(normalized.reduce((sum, task) => sum + task.normalizedShare * task.exposure / 100, 0))
  const skillGaps = normalized.map(task => ({ name: task.name, gap: round(Math.max(0, task.skillDemand - task.skillSupply)), demand: task.skillDemand, supply: task.skillSupply }))
    .sort((a, b) => b.gap - a.gap)

  const baseline = Math.max(1, Number(parameters.baselineEmployment ?? 100))
  const substitutionStrength = clamp(parameters.taskSubstitution ?? 55) / 100
  const aiProductivity = clamp(parameters.aiProductivity ?? 50) / 100
  const demandExpansion = clamp(parameters.demandExpansion ?? 45) / 100
  const complementarity = clamp(parameters.complementarity ?? 60) / 100
  const training = clamp(parameters.trainingInvestment ?? 50) / 100
  const aiCost = clamp(parameters.aiCost ?? 35) / 100
  const substitution = -baseline * shares.automation / 100 * substitutionStrength * 0.8
  const scale = baseline * aiProductivity * demandExpansion * 0.45
  const complement = baseline * shares.augmentation / 100 * complementarity * (0.25 + training * 0.5)
  const newTask = baseline * shares.newTask / 100 * (0.2 + aiProductivity * 0.5)
  const costDrag = baseline * aiCost * 0.04
  const shortTermEmployment = baseline + substitution + scale * 0.35 + complement * 0.25 + newTask * 0.2 - costDrag
  const longTermEmployment = baseline + substitution * 0.75 + scale + complement + newTask - costDrag
  const effects = {
    substitution: round(substitution), scale: round(scale), complement: round(complement), newTask: round(newTask), cost: round(-costDrag),
  }
  const direction = longTermEmployment > baseline + 1 ? '总就业增加'
    : longTermEmployment < baseline - 1 ? '总就业下降' : '总就业近似稳定但任务结构改变'
  return {
    tasks: normalized.map(task => ({ ...task, normalizedShare: round(task.normalizedShare) })),
    shares, exposureIndex, skillGaps, topSkillGaps: skillGaps.slice(0, 3),
    retrainingPriority: round((exposureIndex * 0.45 + meanTop(skillGaps) * 0.55)),
    effects,
    baselineEmployment: round(baseline), shortTermEmployment: round(shortTermEmployment), longTermEmployment: round(longTermEmployment),
    highSkillChange: round(complement + newTask + scale * 0.35),
    lowSkillChange: round(substitution + scale * 0.25),
    conclusion: `${direction}。这是由学生设置的替代、需求扩张、技能互补、培训与新任务参数共同产生的情景结果。`,
    boundary: '任务比例和参数均为可修改的教学情景，不是职业消失概率，也不是现实就业人数预测。',
  }
}

function meanTop(gaps) {
  const top = gaps.slice(0, 3)
  return top.length ? top.reduce((sum, item) => sum + item.gap, 0) / top.length : 0
}
