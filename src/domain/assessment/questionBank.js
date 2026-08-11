function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const option = (value, label) => ({ value, label })

export function buildPracticeSet(seed = 202608) {
  const random = seededRandom(seed)
  const laborForce = 680 + Math.floor(random() * 80)
  const unemployed = 34 + Math.floor(random() * 24)
  const employed = laborForce - unemployed
  const moving = [80, 88, 92].map(value => value + Math.floor(random() * 5))
  const movingAnswer = Number((moving.reduce((sum, value) => sum + value, 0) / 3).toFixed(1))
  return [
    {
      id: `indicator-${seed}`, dimension: '基础概念与指标', points: 15, type: 'concept_choice', responseType: 'single', chapter: '第一章/失业指标',
      prompt: '计算失业率时，正确的分母是什么？',
      options: [option('a', '劳动年龄人口'), option('b', '劳动力人口'), option('c', '就业人口'), option('d', '总人口')], answer: 'b',
      explanation: '失业率=失业人口÷劳动力人口×100%。', commonError: '把非劳动力也放入分母。', returnTo: '/analysis/market',
    },
    {
      id: `calculation-${seed}`, dimension: '核心模型与计算', points: 12, type: 'indicator_calculation', responseType: 'numeric', chapter: '第九章',
      prompt: `某地区劳动力人口为 ${laborForce} 万人，就业人口为 ${employed} 万人。失业率约为多少？（保留1位小数，填写百分数数值）`,
      answer: Number((unemployed / laborForce * 100).toFixed(1)), tolerance: 0.1,
      explanation: `失业人口=${laborForce}-${employed}=${unemployed}，再除以劳动力人口。`, commonError: '用总人口或就业人口作分母。', returnTo: '/lab/unemployment',
    },
    {
      id: `vmp-${seed}`, dimension: '核心模型与计算', points: 13, type: 'model_choice', responseType: 'single', chapter: '第三章',
      prompt: '完全竞争且产品价格给定时，企业短期雇佣劳动的教材条件是：',
      options: [option('a', '平均产量=工资'), option('b', 'VMP=P×MPL=W'), option('c', '总产量最大'), option('d', '工资=资本租金')], answer: 'b',
      explanation: '企业比较劳动的边际收益产品与工资成本。', commonError: '把平均量与边际量混淆。', returnTo: '/lab/enterprise',
    },
    {
      id: `curve-${seed}`, dimension: '曲线与机制分析', points: 10, type: 'curve_judgment', responseType: 'single', chapter: '第二章',
      prompt: '工资提高后，若替代效应强于收入效应，个人工作时间通常如何变化？',
      options: [option('a', '增加'), option('b', '减少'), option('c', '必然不变'), option('d', '无法讨论任何方向')], answer: 'a',
      explanation: '休闲机会成本上升，替代效应推动更多工作。', commonError: '认为工资提高只会产生一种效应。', returnTo: '/lab/supply',
    },
    {
      id: `mechanism-${seed}`, dimension: '曲线与机制分析', points: 10, type: 'mechanism_multiple', responseType: 'multiple', chapter: '第三章/AI情景',
      prompt: 'AI生产率提高后，就业不一定下降。下列哪些机制可能抵消替代效应？',
      options: [option('a', '产品需求扩张的规模效应'), option('b', '劳动与AI互补'), option('c', '新任务产生'), option('d', '把情景参数称为真实预测')], answer: ['a', 'b', 'c'],
      explanation: '就业方向由替代、规模、互补和新任务效应共同决定。', commonError: '把技术进步机械等同于岗位消失。', returnTo: '/lab/ai-occupation',
    },
    {
      id: `chart-${seed}`, dimension: '数据与图表分析', points: 10, type: 'chart_reading', responseType: 'single', chapter: '数据分析',
      prompt: '平均工资明显高于中位工资，最稳妥的初步判断是：',
      options: [option('a', '所有人工资都很高'), option('b', '高工资值可能拉高平均数，应继续看分位数'), option('c', '工资一定服从正态分布'), option('d', '中位数一定填错')], answer: 'b',
      explanation: '平均数对极端值敏感，中位数更接近典型位置。', commonError: '用单一集中趋势指标替代分布分析。', returnTo: '/analysis/market',
    },
    {
      id: `moving-${seed}`, dimension: '数据与图表分析', points: 10, type: 'moving_average', responseType: 'numeric', chapter: '基础预测',
      prompt: `最近三期岗位需求指数分别为 ${moving.join('、')}。三期移动平均预测值是多少？（保留1位小数）`,
      answer: movingAnswer, tolerance: 0.1, explanation: '将最近三期观测值相加后除以3。', commonError: '混入更早期间或使用增长率代替水平值。', returnTo: '/forecast/basic',
    },
    {
      id: `error-${seed}`, dimension: '基础预测与AI错误识别', points: 10, type: 'forecast_error_judgment', responseType: 'single', chapter: '基础预测',
      prompt: '某方法在历史留出期的 RMSE 最小，以下表述哪项正确？',
      options: [option('a', '未来一定最好'), option('b', '只说明该留出期表现较好，仍要检查假设与稳定性'), option('c', '已经证明因果关系'), option('d', '无需再看误差样本数')], answer: 'b',
      explanation: '回测表现依赖样本、切分和未来结构是否延续。', commonError: '把历史拟合排名当成未来保证。', returnTo: '/forecast/basic',
    },
    {
      id: `source-${seed}`, dimension: '基础预测与AI错误识别', points: 5, type: 'source_classification', responseType: 'multiple', chapter: '方法边界',
      prompt: '下列哪些属于情景推演而不是统计预测？',
      options: [option('a', '人为设定AI替代强度'), option('b', '人为设定培训补贴'), option('c', '用历史留出期计算MAE'), option('d', '人为设定人口增长情景')], answer: ['a', 'b', 'd'],
      explanation: '情景推演来自明确的人为假设；回测误差来自历史观测与预测比较。', commonError: '把所有未来数值都称为预测。', returnTo: '/forecast/basic',
    },
    {
      id: `audit-${seed}`, dimension: '基础预测与AI错误识别', points: 5, type: 'ai_error_audit', responseType: 'multiple', chapter: 'AI回答审计',
      prompt: '外部AI回答称“某职业三年后必然减少37.2%”，但没有数据。应标记哪些问题？',
      options: [option('a', '虚假精确'), option('b', '缺少数据来源与日期'), option('c', '把AI暴露等同于岗位消失'), option('d', '结论已经足够可靠')], answer: ['a', 'b', 'c'],
      explanation: '应检查来源、期限、假设、总体边界和不确定性。', commonError: '因为文字流畅就接受精确结论。', returnTo: '/practice/exam',
    },
  ]
}

export const assessmentBlueprint = [
  ['基础概念与指标', 15], ['核心模型与计算', 25], ['曲线与机制分析', 20],
  ['数据与图表分析', 20], ['基础预测与AI错误识别', 20],
].map(([dimension, points]) => ({ dimension, points }))
