const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const range = (start, end, count) =>
  Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1))

export function simulateUnemployment(p = {}) {
  const naturalRate = Number(p.natural_rate ?? 5)
  const minimumWage = Number(p.min_wage ?? 28)
  const benefit = Number(p.unemployment_benefit ?? 2500)
  const mismatch = Number(p.skill_mismatch ?? 0.8)
  const aiRisk = Number(p.ai_risk ?? 30)
  const demandShock = Number(p.labor_demand_shock ?? 0)

  const frictional = clamp(naturalRate * 0.58 + benefit / 10000, 0, 12)
  const structural = clamp(mismatch * 1.55 + aiRisk * 0.012, 0, 12)
  const minimumWageEffect = clamp(Math.max(0, minimumWage - 30) * 0.045, 0, 6)
  const technological = clamp(aiRisk * 0.014 * (0.55 + mismatch * 0.25), 0, 8)
  const cyclical = clamp(-demandShock * 0.08, 0, 10)
  const total = frictional + structural + minimumWageEffect + technological + cyclical

  const months = Array.from({ length: 49 }, (_, index) => index)
  const initialRate = clamp(total + 3 + Math.max(-demandShock, 0) * 0.04, 0, 30)
  const unemploymentRate = months.map(month =>
    round(total + (initialRate - total) * Math.exp(-month / 8)))

  const separationRate = clamp(0.018 + structural / 500 + cyclical / 350, 0.005, 0.12)
  const jobFindingProbability = clamp(0.34 - mismatch * 0.055 - aiRisk * 0.0008 + demandShock * 0.001, 0.04, 0.75)
  const participationEntry = clamp(0.018 + benefit / 300000, 0.005, 0.08)
  const laborForceExit = clamp(0.012 + Math.max(aiRisk - 55, 0) * 0.0002, 0.005, 0.08)

  return {
    total_unemployment_rate: round(total),
    natural_unemployment_rate: round(frictional + structural),
    breakdown: {
      frictional: round(frictional),
      structural: round(structural),
      minimum_wage_effect: round(minimumWageEffect),
      technological: round(technological),
      cyclical: round(cyclical),
    },
    time_series: { months, unemployment_rate: unemploymentRate },
    stock_flow: {
      period: '月',
      separation_rate_pct: round(separationRate * 100),
      job_finding_probability_pct: round(jobFindingProbability * 100),
      participation_entry_pct: round(participationEntry * 100),
      labor_force_exit_pct: round(laborForceExit * 100),
    },
    model: {
      result_type: '教材机制模拟',
      note: '自然失业率由摩擦性与结构性机制共同决定，不把自然失业率重复计入摩擦性失业。',
    },
  }
}

export function simulateMinimumWage(p = {}) {
  const minimumWage = Number(p.min_wage ?? 28)
  const averageWage = Math.max(Number(p.avg_wage ?? 54), 1)
  const employment = Math.max(Number(p.employment ?? 870), 0)
  const elasticity = Number(p.demand_elasticity ?? -0.15)
  const kaitz = minimumWage / averageWage
  const bindingGap = Math.max(kaitz - 0.5, 0)
  const rawChangePct = elasticity * bindingGap * 100
  const changePct = clamp(rawChangePct, -100, 1000)
  const validityWarning = rawChangePct < -100
    ? '原始结果超出线性弹性近似的有效范围，情景就业人数已按不低于 0 处理。'
    : ''

  return {
    kaitz_index: round(kaitz, 3),
    current_employment: round(employment, 1),
    predicted_employment: round(Math.max(0, employment * (1 + changePct / 100)), 1),
    employment_change_pct: round(changePct),
    raw_employment_change_pct: round(rawChangePct),
    validity_warning: validityWarning,
    affected_worker_pct: round(clamp(bindingGap * 120, 0, 100)),
    scenarios: [-0.05, -0.1, -0.15, -0.2, -0.3].map(item => ({
      elasticity: item,
      employment_change_pct: round(clamp(item * bindingGap * 100, -100, 1000)),
    })),
    assumptions: {
      demand_elasticity: elasticity,
      period: '单期比较',
      uncertainty: '就业变化对需求弹性假设敏感；图中区间是情景比较，不是地区实证预测。',
    },
    model: { result_type: '教学情景参数' },
  }
}

export function simulateSearch(p = {}) {
  const benefit = Math.max(Number(p.benefit ?? 2500), 0)
  const searchCost = Math.max(Number(p.search_cost ?? 800), 0)
  const expectedOffer = Math.max(Number(p.expected_offer ?? 6500), 1)
  const offerUncertainty = clamp(Number(p.offer_uncertainty ?? 1200), 200, 5000)
  const patience = clamp(Number(p.patience ?? 0.45), 0, 1)
  const reservationWage = benefit + searchCost + patience * Math.max(expectedOffer - benefit, 0)
  const acceptanceProbability = 1 / (1 + Math.exp((reservationWage - expectedOffer) / offerUncertainty))
  const expectedDuration = 1 / Math.max(acceptanceProbability, 0.01)
  const offers = range(Math.max(1000, expectedOffer - 3500), expectedOffer + 4500, 25)
  return {
    reservation_wage: round(reservationWage, 0),
    acceptance_probability_pct: round(acceptanceProbability * 100, 1),
    expected_search_duration_months: round(expectedDuration, 1),
    curve: offers.map(offer => ({
      offer: round(offer, 0),
      acceptance_probability_pct: round(
        (1 / (1 + Math.exp((reservationWage - offer) / offerUncertainty))) * 100,
        1,
      ),
    })),
    explanation: '保留工资是求职者愿意接受工作的最低工资。救济、搜寻成本、未来报价预期和等待耐心会共同影响保留工资与搜寻期限。',
    model: { result_type: '教材机制模拟', period: '月' },
  }
}

export function simulateDmp(p = {}) {
  const unemployed = Math.max(Number(p.unemployed ?? 120), 1)
  const vacancies = Math.max(Number(p.vacancies ?? 80), 1)
  const efficiency = clamp(Number(p.matching_efficiency ?? 0.65), 0.01, 2)
  const separation = clamp(Number(p.separation_rate ?? 0.025), 0, 0.5)
  const alpha = clamp(Number(p.alpha ?? 0.5), 0.05, 0.95)
  const theta = vacancies / unemployed

  const jobFindingHazard = efficiency * (theta ** (1 - alpha))
  const vacancyFillingHazard = efficiency * (theta ** (-alpha))
  const jobFindingProbability = 1 - Math.exp(-jobFindingHazard)
  const vacancyFillingProbability = 1 - Math.exp(-vacancyFillingHazard)
  const matches = Math.min(
    unemployed * jobFindingProbability,
    vacancies * vacancyFillingProbability,
    unemployed,
    vacancies,
  )
  const steady = separation / Math.max(separation + jobFindingProbability, 1e-9)
  const curve = range(0.2, 1, 17).map(item => {
    const hazard = item * (theta ** (1 - alpha))
    const probability = 1 - Math.exp(-hazard)
    return {
      matching_efficiency: round(item, 2),
      job_finding_rate: round(probability * 100),
      steady_unemployment_rate: round((separation / (separation + probability)) * 100),
    }
  })

  return {
    matches: round(matches),
    theta: round(theta, 3),
    job_finding_hazard: round(jobFindingHazard, 4),
    vacancy_filling_hazard: round(vacancyFillingHazard, 4),
    job_finding_rate: round(jobFindingProbability * 100),
    vacancy_filling_rate: round(vacancyFillingProbability * 100),
    steady_unemployment_rate: round(steady * 100),
    period: '月',
    diagnosis: '匹配函数给出连续时间风险率，页面显示值已转换为单月概率。提高匹配效率会提高求职成功概率并降低稳态失业率。',
    curve,
    model: { result_type: '教材机制模拟', formula: 'M=mU^alpha V^(1-alpha)' },
  }
}

export function simulateBeveridge(p = {}) {
  const aiRisk = Number(p.ai_risk ?? 30)
  const mismatch = Number(p.mismatch_index ?? 0.5)
  const policies = Array.isArray(p.active_policies) ? p.active_policies : []
  const training = policies.some(item => String(item).includes('技能')) ? 0.95 : 0
  const demandSupport = policies.filter(item =>
    String(item).includes('工资') || String(item).includes('救济')).length * 0.12

  const baselineShift = 0.75
  const structuralShift = Math.max(0, mismatch * 1.25 + aiRisk * 0.011 - training)
  const currentShift = baselineShift + structuralShift
  const makeCurve = shift => range(2, 14, 61).map(u => ({
    u: round(u),
    v: round(clamp(0.8 + shift + 13.5 / u, 0, 15), 3),
  }))

  const cycleMovement = clamp(demandSupport - aiRisk * 0.002, -1.2, 1.2)
  const currentU = clamp(5.2 + structuralShift * 0.62 - cycleMovement, 2, 14)
  const currentV = clamp(0.8 + currentShift + 13.5 / currentU + cycleMovement * 0.7, 0, 15)

  let diagnosisLevel = 'SAFE'
  let diagnosisText = '当前运行点接近基准曲线，主要体现正常搜寻与岗位转换。'
  if (training > 0) {
    diagnosisLevel = 'SUCCESS'
    diagnosisText = '技能重塑提高匹配效率，使当前曲线相对未干预情景向原点移动。'
  } else if (structuralShift > 1.6) {
    diagnosisLevel = 'WARNING'
    diagnosisText = '技能错配和技术冲击使整条曲线外移，高失业与高空缺可能同时出现。'
  } else if (Math.abs(cycleMovement) > 0.35) {
    diagnosisLevel = 'NOTICE'
    diagnosisText = '需求侧变化主要表现为沿既有曲线移动，不等同于匹配结构恶化。'
  }

  return {
    u_current: round(currentU),
    v_current: round(currentV),
    u_natural: round(4.4 + structuralShift * 0.45),
    baseline_curve_points: makeCurve(baselineShift),
    curve_points: makeCurve(currentShift),
    chart_domain: { u_min: 0, u_max: 15, v_min: 0, v_max: 15 },
    diagnosis_level: diagnosisLevel,
    diagnosis_text: diagnosisText,
    movement_type: structuralShift > 0.8 ? '曲线整体移动' : '沿曲线移动为主',
    model: {
      result_type: '教材机制模拟',
      formula: '稳态条件与匹配效率共同决定失业率和岗位空缺率之间的反向关系。',
    },
  }
}
