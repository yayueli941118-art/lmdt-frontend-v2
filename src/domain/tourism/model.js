const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const TOURISM_PATTERN = /文旅|旅游|会展|景区|研学|文博/
const DIGITAL_PATTERN = /数据|数字|新媒体|短视频|直播|SQL|Python|可视化|智慧/

function salaryMidpoint(sample) {
  const minimum = Number(sample.salaryMin || 0)
  const maximum = Number(sample.salaryMax || 0)
  if (minimum > 0 && maximum > 0) return (minimum + maximum) / 2
  return minimum || maximum || 0
}

function splitSkills(value) {
  return String(value || '').split(/[；;、,，\n\r\t ]+/).map(item => item.trim()).filter(Boolean)
}

function countBy(values) {
  return values.filter(Boolean).reduce((result, value) => {
    result[value] = (result[value] || 0) + 1
    return result
  }, {})
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  if (!sorted.length) return 0
  const left = sorted[Math.floor((sorted.length - 1) / 2)]
  const right = sorted[Math.ceil((sorted.length - 1) / 2)]
  return (left + right) / 2
}

export function calibrateTourism(samples = [], target = {}) {
  const validSamples = samples.filter(item => item && (item.position || item.company))
  const salaryValues = validSamples.map(salaryMidpoint).filter(value => value > 0)
  const tourismSamples = validSamples.filter(item =>
    TOURISM_PATTERN.test(`${item.industry || ''}${item.position || ''}`))
  const targetMatches = TOURISM_PATTERN.test(`${target.industry || ''}${target.position || ''}`)
  const salaryMissingRate = validSamples.length
    ? 1 - salaryValues.length / validSamples.length
    : 1
  const skillTokens = validSamples.flatMap(item => splitSkills(item.skills))
  const digitalShare = skillTokens.length
    ? skillTokens.filter(item => DIGITAL_PATTERN.test(item)).length / skillTokens.length
    : 0
  const reasons = []

  if (validSamples.length < 10) reasons.push('至少需要10条有效招聘样本')
  if (salaryMissingRate > 0.3) reasons.push('薪资缺失率超过30%')
  if (!targetMatches && tourismSamples.length / Math.max(validSamples.length, 1) < 0.5) {
    reasons.push('研究对象或多数样本与文旅/会展行业不匹配')
  }
  if (!skillTokens.length) reasons.push('缺少可用于技能结构校准的关键词')

  const dates = validSamples.map(item => item.collectDate).filter(Boolean).sort()
  const calibratedSalary = round(median(salaryValues), 0)
  const digitalLevel = round(clamp(42 + digitalShare * 90, 20, 88), 0)
  const uncertainty = clamp(
    8 + 120 / Math.max(validSamples.length, 10) + salaryMissingRate * 24,
    8,
    35,
  )

  return {
    status: reasons.length ? 'rejected' : 'ready',
    reasons,
    sample_size: validSamples.length,
    collection_start: dates[0] || '',
    collection_end: dates.at(-1) || '',
    platform_composition: countBy(validSamples.map(item => item.platform || '未标注')),
    city_composition: countBy(validSamples.map(item => item.city || '未标注')),
    salary_missing_rate_pct: round(salaryMissingRate * 100, 1),
    skill_token_count: skillTokens.length,
    parameters: {
      salary_reference: calibratedSalary,
      digital_level: digitalLevel,
      sample_heat_baseline: 100,
    },
    before_after: [
      { name: '平均薪酬', before: 7800, after: calibratedSalary || 7800, unit: '元/月' },
      { name: '数字化水平', before: 62, after: digitalLevel, unit: '指数' },
    ],
    model_version: 'tourism-scenario-2.1',
    uncertainty_pct: round(uncertainty, 1),
    result_type: '用户导入样本校准',
    note: '校准只改变相对情景参数。招聘广告数量不等于社会真实岗位需求。',
  }
}

export function simulateTourism(p = {}) {
  const city = p.city || '成渝双城联动'
  const sector = p.sector || '会展节庆'
  const calibration = p.calibration?.status === 'ready' ? p.calibration : null
  const touristGrowth = Number(p.tourist_growth ?? 15)
  const digitalLevel = Number(p.digital_level ?? calibration?.parameters?.digital_level ?? 55)
  const eventIntensity = Number(p.event_intensity ?? 60)
  const seasonality = p.seasonality || '中'
  const salary = Number(p.salary ?? calibration?.parameters?.salary_reference ?? 7500)
  const stability = Number(p.stability ?? 65)
  const training = Number(p.training ?? 55)
  const promotion = Number(p.promotion ?? 60)
  const policy = p.policy || '组合政策'

  const cityFactor = { 成都: 1.04, 重庆: 1, 成渝双城联动: 1.08 }[city] || 1
  const sectorFactor = {
    景区运营: 1.02,
    会展节庆: 1.06,
    研学旅行: 1,
    夜间文旅: 1.04,
    数字文博: 1.05,
    智慧景区: 1.07,
  }[sector] || 1
  const seasonFactor = { 低: 0.98, 中: 1, 高: 1.04 }[seasonality] || 1

  const definitions = [
    { name: '服务运营', base: 100, visitor: 0.75, digital: 0.12, event: 0.34, skill: '服务运营能力' },
    { name: '活动策划', base: 88, visitor: 0.42, digital: 0.18, event: 0.82, skill: '活动策划能力' },
    { name: '数字营销', base: 82, visitor: 0.35, digital: 0.78, event: 0.45, skill: '内容传播/新媒体能力' },
    { name: '数据分析', base: 66, visitor: 0.18, digital: 0.86, event: 0.25, skill: '数据分析能力' },
    { name: '研学导师', base: 74, visitor: 0.58, digital: 0.16, event: 0.22, skill: '文旅知识/地方文化理解' },
    { name: '智慧景区运营', base: 70, visitor: 0.26, digital: 0.9, event: 0.18, skill: '学生数字技能水平' },
  ]
  const sectorTilt = {
    景区运营: { 服务运营: 1.16, 智慧景区运营: 1.1 },
    会展节庆: { 活动策划: 1.2, 数字营销: 1.1 },
    研学旅行: { 研学导师: 1.24, 服务运营: 1.06 },
    夜间文旅: { 服务运营: 1.1, 数字营销: 1.15, 活动策划: 1.1 },
    数字文博: { 数据分析: 1.15, 数字营销: 1.13, 智慧景区运营: 1.1 },
    智慧景区: { 智慧景区运营: 1.22, 数据分析: 1.14 },
  }[sector] || {}
  const uncertainty = Number(calibration?.uncertainty_pct ?? 18)
  const jobs = definitions.map(job => {
    const baseline = job.base * cityFactor * sectorFactor * (sectorTilt[job.name] || 1)
    const forecast = baseline
      * (1 + touristGrowth * job.visitor / 100)
      * (1 + digitalLevel / 100 * job.digital * 0.5)
      * (1 + eventIntensity / 100 * job.event * 0.38)
      * seasonFactor
    return {
      name: job.name,
      baseline: round(baseline, 0),
      forecast: round(forecast, 0),
      forecast_low: round(forecast * (1 - uncertainty / 100), 0),
      forecast_high: round(forecast * (1 + uncertainty / 100), 0),
      growth_pct: round((forecast / baseline - 1) * 100, 1),
      share_pct: 0,
      skill: job.skill,
    }
  })
  const baselineTotal = jobs.reduce((sum, job) => sum + job.baseline, 0)
  const forecastTotal = jobs.reduce((sum, job) => sum + job.forecast, 0)
  jobs.forEach(job => {
    job.share_pct = round(job.forecast / forecastTotal * 100, 1)
  })
  const heatIndex = round(forecastTotal / baselineTotal * 100, 1)
  const fastest = [...jobs].sort((a, b) => b.growth_pct - a.growth_pct)[0]

  const supply = {
    学生数字技能水平: Number(p.digital_skill ?? 58),
    数据分析能力: Number(p.data_skill ?? 50),
    服务运营能力: Number(p.service_skill ?? 65),
    活动策划能力: Number(p.planning_skill ?? 55),
    '内容传播/新媒体能力': Number(p.media_skill ?? 60),
    '文旅知识/地方文化理解': Number(p.culture_skill ?? 62),
  }
  const skillDemand = {
    学生数字技能水平: 54 + digitalLevel * 0.36 + (sector === '智慧景区' ? 10 : 0),
    数据分析能力: 48 + digitalLevel * 0.42 + (sector === '数字文博' ? 8 : 0),
    服务运营能力: 58 + Math.max(touristGrowth, 0) * 0.32 + eventIntensity * 0.12,
    活动策划能力: 50 + eventIntensity * 0.36 + (sector === '会展节庆' ? 12 : 0),
    '内容传播/新媒体能力': 52 + digitalLevel * 0.26 + eventIntensity * 0.18,
    '文旅知识/地方文化理解': 62 + (sector === '研学旅行' ? 14 : 0) + Math.max(touristGrowth, 0) * 0.12,
  }
  const skillItems = Object.keys(skillDemand).map(name => ({
    name,
    demand: clamp(round(skillDemand[name]), 0, 100),
    supply: clamp(round(supply[name]), 0, 100),
    gap: clamp(round(skillDemand[name] - supply[name]), 0, 100),
  }))
  const largestGaps = [...skillItems].sort((a, b) => b.gap - a.gap).slice(0, 3)

  const wageScore = clamp((salary - 3000) / 12000 * 100, 0, 100)
  const attractionIndex = clamp(round(wageScore * 0.38 + stability * 0.22 + training * 0.2 + promotion * 0.2), 0, 100)
  const turnoverRisk = attractionIndex >= 75 ? '低' : attractionIndex >= 55 ? '中' : '高'
  const applicantHeatLow = round(heatIndex * (0.65 + attractionIndex / 300), 0)
  const applicantHeatHigh = round(heatIndex * (0.85 + attractionIndex / 220), 0)

  const averageGap = skillItems.reduce((sum, item) => sum + item.gap, 0) / skillItems.length
  const baseMatching = clamp(round(100 - averageGap * 0.9 + attractionIndex * 0.12), 35, 96)
  const scenarioDefinitions = [
    { name: '基准情景', match: 0, gap: 0, attraction: 0 },
    { name: '培训补贴', match: 7, gap: -8, attraction: 4 },
    { name: '校企合作', match: 9, gap: -6, attraction: 3 },
    { name: '数字化投资', match: digitalLevel > 70 ? 8 : 5, gap: -4, attraction: 5 },
    { name: '区域人才流动便利化', match: city === '成渝双城联动' ? 8 : 6, gap: -3, attraction: 6 },
    { name: '组合政策', match: 16, gap: -13, attraction: 10 },
  ]
  const policyScenarios = scenarioDefinitions.map(item => ({
    name: item.name,
    matching: clamp(round(baseMatching + item.match), 0, 100),
    skill_gap: clamp(round(averageGap + item.gap), 0, 100),
    attraction: clamp(round(attractionIndex + item.attraction), 0, 100),
  }))
  const recommended = [...policyScenarios]
    .sort((a, b) => (b.matching + b.attraction - b.skill_gap) - (a.matching + a.attraction - a.skill_gap))[0].name
  const selectedScenario = policyScenarios.find(item => item.name === policy) || policyScenarios[0]

  return {
    demand: {
      total: heatIndex,
      heat_index: heatIndex,
      fastest_job: fastest.name,
      jobs,
      interpretation: '游客增长主要提高服务、策划和研学岗位热度；数字化水平主要提高数字营销、数据分析与智慧景区岗位热度。',
      unit: '相对热度指数（基准=100）',
    },
    skills: {
      largest_gap: largestGaps[0]?.name || '',
      items: skillItems,
      recommendations: largestGaps.map(item => `优先补强${item.name}，当前情景缺口约 ${item.gap} 分。`),
    },
    attraction: {
      index: attractionIndex,
      applicant_heat_range: `${applicantHeatLow}-${applicantHeatHigh}`,
      turnover_risk: turnoverRisk,
      explanation: '薪酬通过补偿性工资差异影响岗位吸引力，稳定性、培训和晋升空间作为非工资收益共同影响进入和留任意愿。',
    },
    policies: {
      selected: policy,
      selected_matching: selectedScenario.matching,
      recommended,
      scenarios: policyScenarios,
      explanation: `${policy}教学情景下，供需匹配指数为 ${selectedScenario.matching}，技能缺口指数为 ${selectedScenario.skill_gap}。这些值用于比较政策方向，不代表真实政策效果。`,
    },
    calibration: calibration || {
      status: 'scenario',
      result_type: '教学情景参数',
      model_version: 'tourism-scenario-2.1',
      uncertainty_pct: uncertainty,
      note: '尚未使用报告工作台样本校准。',
    },
    conclusion: `${city}${sector}情景下，样本岗位热度指数为 ${heatIndex}，增长最快的岗位类型是${fastest.name}；最大技能缺口为${largestGaps[0]?.name || '数字技能'}。${recommended}是当前教学参数下得分最高的比较情景。`,
  }
}
