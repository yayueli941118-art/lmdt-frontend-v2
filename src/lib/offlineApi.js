const round = (value, digits = 2) => Number((value || 0).toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const range = (start, end, count) =>
  Array.from({ length: count }, (_, i) => start + ((end - start) * i) / (count - 1))

function payload(config) {
  if (!config?.data) return {}
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data)
    } catch {
      return {}
    }
  }
  return config.data
}

function pathOf(config) {
  try {
    return new URL(config.url, window.location.origin).pathname
  } catch {
    return config?.url || ''
  }
}

function cdLaborSupply(wage, beta, T = 24) {
  const labor = T * (1 - beta)
  const consumption = wage * labor
  return {
    labor_hours: round(labor),
    consumption: round(consumption),
    leisure_hours: round(T - labor),
    utility: round((labor ** beta) * (consumption ** (1 - beta)), 4),
  }
}

function supplyDecompose(p) {
  const wageInitial = Number(p.wage_initial || 32)
  const wageNew = Number(p.wage_new || 54)
  const beta = clamp(Number(p.beta || 0.4), 0.05, 0.95)
  const T = Number(p.T || 24)
  const A = cdLaborSupply(wageInitial, beta, T)
  const C = cdLaborSupply(wageNew, beta, T)
  const laborB = clamp(T * (1 - beta) * ((wageNew / wageInitial) ** beta), 0.5, T - 0.5)
  const wages = range(wageInitial * 0.5, wageNew * 1.5, 100).map(v => round(v))
  const laborHours = wages.map(w => cdLaborSupply(w, beta, T).labor_hours)
  const sub = laborB - A.labor_hours
  const inc = C.labor_hours - laborB
  return {
    point_A: { wage: wageInitial, ...A },
    point_B: {
      wage: wageNew,
      labor_hours: round(laborB),
      consumption: round(wageNew * laborB),
      leisure_hours: round(T - laborB),
      type: 'compensated',
    },
    point_C: { wage: wageNew, ...C },
    effects: {
      substitution_effect_hours: round(sub),
      income_effect_hours: round(inc),
      total_effect_hours: round(C.labor_hours - A.labor_hours),
      substitution_pct: round((sub / A.labor_hours) * 100),
      income_pct: round((inc / laborB) * 100),
      total_pct: round(((C.labor_hours - A.labor_hours) / A.labor_hours) * 100),
      dominant_effect: Math.abs(sub) > Math.abs(inc) ? '替代效应主导' : '收入效应主导',
      backward_bending: sub > 0 && inc < 0 && Math.abs(inc) > Math.abs(sub),
    },
    supply_curve: { wages, labor_hours: laborHours, backward_bending_point: null },
  }
}

function cesOutput(L, K, sigma, A = 1, alpha = 0.6) {
  const rho = (sigma - 1) / sigma
  if (Math.abs(rho) < 1e-6) return A * (K ** alpha) * (L ** (1 - alpha))
  return A * Math.max(alpha * (K ** rho) + (1 - alpha) * (L ** rho), 1e-12) ** (1 / rho)
}

function cesMpl(L, K, sigma, A = 1, alpha = 0.6) {
  const rho = (sigma - 1) / sigma
  if (Math.abs(rho) < 1e-6) return A * (1 - alpha) * (K ** alpha) * (L ** -alpha)
  const val = Math.max(alpha * (K ** rho) + (1 - alpha) * (L ** rho), 1e-12)
  return A * (1 - alpha) * (L ** (rho - 1)) * (val ** (1 / rho - 1))
}

function cesMpk(L, K, sigma, A = 1, alpha = 0.6) {
  const rho = (sigma - 1) / sigma
  if (Math.abs(rho) < 1e-6) return A * alpha * (L ** (1 - alpha)) * (K ** (alpha - 1))
  const val = Math.max(alpha * (K ** rho) + (1 - alpha) * (L ** rho), 1e-12)
  return A * alpha * (K ** (rho - 1)) * (val ** (1 / rho - 1))
}

function demandCurve(p) {
  const K = Number(p.K || 500)
  const sigma = Number(p.sigma || 1.2)
  const factor = String(p.tech_type || '').includes('替代') ? 0.55 : String(p.tech_type || '').includes('互补') ? 1.65 : 1
  const wages = range(5, 200, 100)
  const laborDemand = wages.map(w => {
    if (sigma <= 0.95) return clamp(((factor * K * 12) / w) ** 0.7, 0.5, 2000)
    if (sigma >= 2) return clamp(((factor * K * 5) / (w * sigma)) ** 1.8, 0.5, 2000)
    return clamp(((factor * K * 10) / w) ** (1 / sigma), 0.5, 2000)
  })
  const mpl = laborDemand.map(L => cesMpl(L, K, sigma, factor))
  return {
    wages: wages.map(v => round(v)),
    labor_demand: laborDemand.map(v => round(v)),
    output: laborDemand.map(L => round(cesOutput(L, K, sigma, factor))),
    mpl: mpl.map(v => round(v)),
    elasticity: [],
    equilibria: wages.map((w, i) => ({ wage: round(w), labor_hours: round(laborDemand[i]), vmp_wage_ratio: round(mpl[i] / w, 3) })).slice(0, 5),
    parameters: { capital: K, sigma, product_price: p.prod_price || 1, technology_type: p.tech_type || '', technology_factor: factor },
  }
}

function factorAllocation(p) {
  const L = Number(p.L || 100)
  const sigma = Number(p.sigma || 1.2)
  const capital = p.K_values || range(100, 2000, 20).map(v => Math.round(v))
  const output = capital.map(K => round(cesOutput(L, K, sigma)))
  const mpl = capital.map(K => round(cesMpl(L, K, sigma), 4))
  const mpk = capital.map(K => round(cesMpk(L, K, sigma), 4))
  const mrts = mpl.map((v, i) => round(v / Math.max(mpk[i], 0.0001), 4))
  const ratios = capital.map(K => round(K / L))
  const best = mrts.reduce((idx, v, i) => Math.abs(v - 1) < Math.abs(mrts[idx] - 1) ? i : idx, 0)
  return { capital, output, mpl, mpk, mrts, capital_labor_ratio: ratios, optimal_k_l: ratios[best] }
}

function beveridge(p) {
  let penaltyU = 0
  let penaltyV = 0
  let policyScore = 0
  const policies = p.active_policies || []
  policies.forEach(policy => {
    if (String(policy).includes('工资')) {
      penaltyU += 0.15
      penaltyV -= 0.1
    }
    if (String(policy).includes('救济')) {
      penaltyU += 0.2
      penaltyV += 0.15
    }
    if (String(policy).includes('技能')) policyScore = 1
  })
  const aiRisk = Number(p.ai_risk || 30)
  const mismatch = Number(p.mismatch_index || 0.5)
  const k = 20 + (mismatch + penaltyU) * 50 + aiRisk * 0.6 - policyScore * 15
  const curve = range(0.5, 15, 50).map(u => ({ u: round(u), v: round(k / u + penaltyV, 3) }))
  const current = curve[25]
  let level = 'SAFE'
  let text = '运行良好：当前市场主要为摩擦性失业，劳动力供需基本匹配。'
  if (policyScore) {
    level = 'SUCCESS'
    text = '政策奏效：技能重塑降低结构性错配，曲线向原点回归。'
  } else if (aiRisk > 70 || (mismatch >= 0.8 && policies.some(policy => String(policy).includes('工资')))) {
    level = 'DANGER'
    text = '风险较高：需求侧冲击无法单独解决技能错配，建议叠加培训和岗位转换支持。'
  } else if (mismatch > 1) {
    level = 'WARNING'
    text = `结构性失业预警：技能错配度 ${mismatch.toFixed(1)}，高失业率与高空缺率并存。`
  }
  return { u_current: current.u, v_current: current.v, u_natural: 5, curve_points: curve, diagnosis_level: level, diagnosis_text: text }
}

function unemployment(p) {
  const frictional = Number(p.natural_rate || 5) + Math.max(0, (Number(p.unemployment_benefit || 2000) - 1500) / 10000)
  const structural = Number(p.skill_mismatch || 0.5) * 4
  const minWage = Math.max(0, (Number(p.min_wage || 25) / 20 - 1) * 3)
  const tech = Number(p.ai_risk || 20) * 0.05
  const cyclical = Math.max(0, Number(p.labor_demand_shock || 0) * 0.5)
  const total = Math.min(25, frictional + structural + minWage + tech + cyclical)
  const months = Array.from({ length: 48 }, (_, i) => i + 1)
  return {
    total_rate: round(total),
    breakdown: { frictional: round(frictional), structural: round(structural), minimum_wage_effect: round(minWage), technological: round(tech), cyclical: round(cyclical) },
    time_series: { months, unemployment_rate: months.map(m => round(total * (1 - Math.exp(-m / 6)))) },
    parameters: p,
  }
}

function minWageImpact(p) {
  const kaitz = Number(p.min_wage || 28) / Math.max(Number(p.avg_wage || 54), 1)
  const employment = Number(p.employment || 870)
  const changePct = kaitz > 0.5 ? -0.15 * (kaitz - 0.5) * 100 : 0
  return {
    kaitz_index: round(kaitz, 3),
    current_employment: employment,
    predicted_employment: round(employment * (1 + changePct / 100), 1),
    employment_change_pct: round(changePct),
    affected_worker_pct: round(clamp((1 - kaitz + 0.3) * 50, 0, 100)),
    scenarios: [-0.05, -0.1, -0.15, -0.2, -0.3].map(e => ({ elasticity: e, employment_change_pct: round(kaitz > 0.5 ? e * (kaitz - 0.5) * 100 : 0) })),
    benchmarks: { US_kaitz_2024: 0.33, China_kaitz_estimate: 0.45, France_kaitz_2024: 0.62 },
  }
}

function dmp(p) {
  const unemployed = Math.max(Number(p.unemployed || 120), 1)
  const vacancies = Math.max(Number(p.vacancies || 80), 1)
  const efficiency = Number(p.matching_efficiency || 0.65)
  const separation = Number(p.separation_rate || 0.025)
  const alpha = Number(p.alpha || 0.5)
  const matches = efficiency * (unemployed ** alpha) * (vacancies ** (1 - alpha))
  const jobFinding = matches / unemployed
  const vacancyFilling = matches / vacancies
  const steady = separation / (separation + jobFinding)
  const curve = range(0.2, 1, 17).map(e => {
    const m = e * (unemployed ** alpha) * (vacancies ** (1 - alpha))
    const jf = m / unemployed
    return { matching_efficiency: round(e, 2), job_finding_rate: round(jf * 100), steady_unemployment_rate: round((separation / (separation + jf)) * 100) }
  })
  return {
    matches: round(matches),
    theta: round(vacancies / unemployed, 3),
    job_finding_rate: round(jobFinding * 100),
    vacancy_filling_rate: round(vacancyFilling * 100),
    steady_unemployment_rate: round(steady * 100),
    diagnosis: '匹配效率越高，求职成功率越高，稳态失业率越低。技能培训、信息平台和公共就业服务会让曲线向更高效率移动。',
    curve,
  }
}

function wageDistribution(p) {
  const industryBase = { '信息技术': 14500, '金融业': 13800, '制造业': 7200, '建筑业': 6500, '批发零售': 5800, '住宿餐饮': 4200, '教育': 8500, '医疗': 9200, '交通运输': 7800, '农业': 3800 }
  const regionMult = { '一线城市': 1.35, '新一线城市': 1.1, '二线城市': 0.85, '三线及以下': 0.65 }
  const industry = Object.keys(industryBase).find(k => String(p.industry || '').includes(k)) || '制造业'
  const region = Object.keys(regionMult).find(k => String(p.region || '').includes(k)) || '二线城市'
  const edu = Number(p.edu_years || 16)
  const exp = Number(p.exp_years || 5)
  const base = Math.exp(7.5 + 0.085 * edu + 0.05 * exp - 0.0006 * exp * exp) * (industryBase[industry] / 6500) * regionMult[region]
  const values = Array.from({ length: 1000 }, (_, i) => base * Math.exp(Math.sin(i * 12.9898) * 0.15))
  const sorted = [...values].sort((a, b) => a - b)
  const pct = q => sorted[Math.floor((q / 100) * (sorted.length - 1))]
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const bins = range(pct(2), pct(98), 20)
  const frequencies = bins.map((b, i) => values.filter(v => v >= b && v < (bins[i + 1] || Infinity)).length)
  const gini = sorted.reduce((acc, v, i) => acc + (i + 1) * v, 0) * 2 / (sorted.length * sorted.reduce((a, b) => a + b, 0)) - (sorted.length + 1) / sorted.length
  return {
    statistics: { mean: round(mean), median: round(pct(50)), std: round(Math.sqrt(values.reduce((a, b) => a + ((b - mean) ** 2), 0) / values.length)), cv: 0.15, min: round(sorted[0]), max: round(sorted.at(-1)), p10_p90_ratio: round(pct(90) / pct(10)), p90_p10_ratio: round(pct(90) / pct(10)), p50_p10_ratio: round(pct(50) / pct(10)), gini: round(gini, 4) },
    distribution: { bins: bins.map(v => round(v)), frequencies },
    deciles: Array.from({ length: 10 }, (_, i) => ({ percentile: (i + 1) * 10, value: round(pct((i + 1) * 10)) })),
    parameters: p,
  }
}

function mincer(p) {
  const edu = Number(p.edu_years || 16)
  const exp = Number(p.exp_years || 5)
  const genderMult = { male: 1.08, female: 0.89, all: 1 }
  const ownerMult = { state: 1.12, foreign: 1.18, private: 0.92, all: 1 }
  let ln = 7.5 + 0.085 * edu + 0.05 * exp - 0.0006 * exp * exp
  ln += Math.log(genderMult[p.gender] || 1) + Math.log(ownerMult[p.ownership] || 1)
  if (p.union_member) ln += Math.log(1.06)
  return {
    predicted_monthly_wage: round(Math.exp(ln)),
    ln_wage: round(ln, 4),
    decomposition: {
      base: 7.5,
      education_contribution: round(0.085 * edu, 3),
      experience_contribution: round(0.05 * exp - 0.0006 * exp * exp, 3),
      gender_effect: round(Math.log(genderMult[p.gender] || 1), 4),
      ownership_effect: round(Math.log(ownerMult[p.ownership] || 1), 4),
      union_effect: p.union_member ? round(Math.log(1.06), 4) : 0,
    },
    parameters: p,
  }
}

function individual(p) {
  const edu = Number(p.edu || 16)
  const disc = Number(p.disc || 0)
  const ages = Array.from({ length: 43 }, (_, i) => i + 18)
  const gradAge = edu + 6
  const base = ages.map(age => Math.exp(7.5 + 0.085 * 12 + 0.06 * Math.max(0, age - 18) - 0.001 * (Math.max(0, age - 18) ** 2)))
  const gross = ages.map(age => Math.exp(7.5 + 0.1 * edu + 0.06 * Math.max(0, age - gradAge) - 0.001 * (Math.max(0, age - gradAge) ** 2)))
  const selected = ages.map((age, i) => age < gradAge ? -2 : gross[i])
  const selectedDisc = selected.map(v => v < 0 ? v : v * (1 - disc / 100))
  const premium = ((selected.reduce((a, b) => a + b, 0) / base.reduce((a, b) => a + b, 0)) - 1) * 100
  const migrationYears = p.migrate ? Array.from({ length: Math.max(0, 60 - Number(p.migrate_age || 28)) }, (_, i) => Number(p.migrate_age || 28) + i + 1) : []
  const migrationNpv = migrationYears.map((_, i) => round((Number(p.w_diff || 0) * 12 - Number(p.c_psych || 0)) * (i + 1) - Number(p.c_move || 0)))
  return {
    status: 'success',
    metrics: { lifetime_premium_pct: round(premium), discrimination_loss_pct: disc, vs_china_baseline_pct: 0, china_baseline_value: 9200, breakeven_age: 34, crossover_age: gradAge, irr_pct: round(Math.max(0, premium / 12)) },
    charts: { age_years: ages, wage_curve_selected: selected.map(v => round(v)), wage_curve_baseline: base.map(v => round(v)), wage_curve_disc: selectedDisc.map(v => round(v)), wage_curve_selected_gross: gross.map(v => round(v)) },
    migration: { is_calculated: Boolean(p.migrate), years: migrationYears, cumulative_npv: migrationNpv, is_worth_it: migrationNpv.at(-1) > 0 },
  }
}

function discrimination(p) {
  const avg = values => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1)
  const wageA = p.group_a_wages || []
  const wageB = p.group_b_wages || []
  const eduA = p.group_a_edu || []
  const eduB = p.group_b_edu || []
  const expA = p.group_a_exp || []
  const expB = p.group_b_exp || []
  const gap = Math.log(avg(wageB) / Math.max(avg(wageA), 1))
  const endowment = (avg(eduB) - avg(eduA)) * 0.085 + (avg(expB) - avg(expA)) * 0.04
  const coefficient = gap - endowment
  const explained = clamp(Math.abs(endowment) / Math.max(Math.abs(gap), 0.001) * 100, 0, 100)
  return {
    decomposition: { total_gap_ln: round(gap, 4), total_gap_pct: round((Math.exp(gap) - 1) * 100), endowment_effect: round(endowment, 4), coefficient_effect: round(coefficient, 4), interaction_effect: round(gap * 0.05, 4), explained_pct: round(explained, 1), unexplained_pct: round(100 - explained, 1), gap_direction: gap > 0 ? 'B组相对A组更高' : 'A组相对B组更高' },
    by_variable: [
      { variable: '常数项', endowment: 0, coefficient: round(coefficient * 0.3, 4), interaction: 0, total: round(coefficient * 0.3, 4) },
      { variable: '受教育年限', endowment: round((avg(eduB) - avg(eduA)) * 0.085, 4), coefficient: round(coefficient * 0.4, 4), interaction: round(gap * 0.02, 4), total: round(gap * 0.35, 4) },
      { variable: '工作经验', endowment: round((avg(expB) - avg(expA)) * 0.04, 4), coefficient: round(coefficient * 0.2, 4), interaction: round(gap * 0.02, 4), total: round(gap * 0.25, 4) },
      { variable: '经验平方', endowment: round(-Math.abs(gap) * 0.03, 4), coefficient: round(coefficient * 0.1, 4), interaction: round(gap * 0.01, 4), total: round(gap * 0.05, 4) },
    ],
    coefficients: { group_a: [7.4, 0.08, 0.05, -0.001], group_b: [7.7, 0.1, 0.055, -0.001], coefficient_names: ['常数项', '受教育年限', '工作经验', '经验平方'], r_squared_a: 0.82, r_squared_b: 0.85 },
    group_a: { mean_wage: round(avg(wageA)), median_wage: round(avg(wageA)), std_wage: 850, mean_edu: round(avg(eduA)), mean_exp: round(avg(expA)), sample_size: wageA.length },
    group_b: { mean_wage: round(avg(wageB)), median_wage: round(avg(wageB)), std_wage: 900, mean_edu: round(avg(eduB)), mean_exp: round(avg(expB)), sample_size: wageB.length },
  }
}

const handlers = [
  ['/api/v2/supply/decompose', supplyDecompose],
  ['/api/v2/demand/curve', demandCurve],
  ['/api/v2/demand/factor-allocation', factorAllocation],
  ['/api/v2/macro/beveridge', beveridge],
  ['/api/v1/macro-lab/simulate', beveridge],
  ['/api/v2/macro/unemployment', unemployment],
  ['/api/v2/macro/min-wage-impact', minWageImpact],
  ['/api/v2/macro/dmp', dmp],
  ['/api/v2/wage/distribution', wageDistribution],
  ['/api/v2/wage/mincer', mincer],
  ['/api/v1/individual-lab/simulate', individual],
  ['/api/v2/discrimination/decompose', discrimination],
]

export function offlineResponse(config) {
  const pathname = pathOf(config)
  const match = handlers.find(([path]) => pathname.endsWith(path))
  if (!match) return null
  return match[1](payload(config))
}
