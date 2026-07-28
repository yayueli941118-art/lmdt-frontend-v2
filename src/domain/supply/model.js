const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round = (value, digits = 2) => Number(value.toFixed(digits))

function normalize(input = {}) {
  return {
    wageInitial: Math.max(Number(input.wage_initial ?? 28), 0.01),
    wageNew: Math.max(Number(input.wage_new ?? 64), 0.01),
    beta: clamp(Number(input.beta ?? 0.3), 0.05, 0.95),
    nonLaborIncome: Number(input.non_labor_income ?? 300),
    nonLaborShock: Number(input.non_labor_shock ?? 160),
    consumptionFloor: Math.max(Number(input.consumption_floor ?? 20), 0),
    leisureFloor: clamp(Number(input.leisure_floor ?? 2), 0, 20),
    timeEndowment: Math.max(Number(input.T ?? 24), 1),
  }
}

export function stoneGearyChoice({
  wage,
  nonLaborIncome,
  beta,
  timeEndowment,
  consumptionFloor,
  leisureFloor,
}) {
  const fullIncome = nonLaborIncome + wage * timeEndowment
  const committedCost = consumptionFloor + wage * leisureFloor
  const surplus = Math.max(fullIncome - committedCost, 1e-8)
  const leisure = clamp(
    leisureFloor + (beta * surplus) / wage,
    leisureFloor + 1e-6,
    timeEndowment - 1e-6,
  )
  const labor = timeEndowment - leisure
  const consumption = nonLaborIncome + wage * labor
  const utility = (
    Math.max(leisure - leisureFloor, 1e-8) ** beta
    * Math.max(consumption - consumptionFloor, 1e-8) ** (1 - beta)
  )
  return {
    labor_hours: round(labor),
    consumption: round(consumption),
    leisure_hours: round(leisure),
    utility: round(utility, 6),
  }
}

export function hicksExpenditure({
  utility,
  wage,
  beta,
  consumptionFloor,
  leisureFloor,
}) {
  const shareTerm = (beta ** beta) * ((1 - beta) ** (1 - beta))
  return (
    wage * leisureFloor
    + consumptionFloor
    + (utility * (wage ** beta)) / shareTerm
  )
}

export function simulateSupply(input = {}) {
  const p = normalize(input)
  const choice = (wage, nonLaborIncome) => stoneGearyChoice({
    wage,
    nonLaborIncome,
    beta: p.beta,
    timeEndowment: p.timeEndowment,
    consumptionFloor: p.consumptionFloor,
    leisureFloor: p.leisureFloor,
  })
  const A = choice(p.wageInitial, p.nonLaborIncome)
  const C = choice(p.wageNew, p.nonLaborIncome)
  const Z = choice(p.wageInitial, p.nonLaborIncome + p.nonLaborShock)
  const compensatedFullIncome = hicksExpenditure({
    utility: A.utility,
    wage: p.wageNew,
    beta: p.beta,
    consumptionFloor: p.consumptionFloor,
    leisureFloor: p.leisureFloor,
  })
  const compensatedNonLaborIncome = compensatedFullIncome - p.wageNew * p.timeEndowment
  const B = choice(p.wageNew, compensatedNonLaborIncome)
  const startWage = Math.max(5, Math.min(p.wageInitial, p.wageNew) * 0.45)
  const endWage = Math.max(p.wageInitial, p.wageNew) * 1.6
  const wages = Array.from({ length: 120 }, (_, index) =>
    startWage + ((endWage - startWage) * index) / 119)
  const laborHours = wages.map(wage => choice(wage, p.nonLaborIncome).labor_hours)
  const turningIndex = laborHours.findIndex((value, index) =>
    index > 0 && value < laborHours[index - 1] - 1e-6)
  const budgetLine = (wage, nonLaborIncome) => [
    [0, round(nonLaborIncome + wage * p.timeEndowment)],
    [p.timeEndowment, round(nonLaborIncome)],
  ]
  const point = (label, wage, value) => ({
    label,
    wage: round(wage),
    ...value,
  })
  const substitution = B.labor_hours - A.labor_hours
  const income = C.labor_hours - B.labor_hours
  const total = C.labor_hours - A.labor_hours
  return {
    model: {
      name: 'Stone-Geary 固定偏好劳动供给',
      formula: 'U=(R-R0)^β(C-C0)^(1-β)，C=V+W(T-R)',
      source: '教材第二章图2-9、图2-10、图2-11的教学机制复现',
      result_type: '教材机制模拟',
    },
    time_endowment: p.timeEndowment,
    non_labor_income: round(p.nonLaborIncome),
    non_labor_shock: round(p.nonLaborShock),
    preference: {
      beta: p.beta,
      consumption_floor: p.consumptionFloor,
      leisure_floor: p.leisureFloor,
    },
    point_A: point('A', p.wageInitial, A),
    point_B: {
      ...point('B', p.wageNew, B),
      type: 'hicks_compensated',
      compensated_non_labor_income: round(compensatedNonLaborIncome),
    },
    point_C: point('C', p.wageNew, C),
    point_Z: point('Z', p.wageInitial, Z),
    budget_lines: {
      initial: budgetLine(p.wageInitial, p.nonLaborIncome),
      new_wage: budgetLine(p.wageNew, p.nonLaborIncome),
      non_labor: budgetLine(p.wageInitial, p.nonLaborIncome + p.nonLaborShock),
      compensated: budgetLine(p.wageNew, compensatedNonLaborIncome),
    },
    effects: {
      substitution_effect_hours: round(substitution),
      income_effect_hours: round(income),
      total_effect_hours: round(total),
      non_labor_income_effect_hours: round(Z.labor_hours - A.labor_hours),
      substitution_pct: round((substitution / Math.max(A.labor_hours, 0.01)) * 100),
      income_pct: round((income / Math.max(B.labor_hours, 0.01)) * 100),
      total_pct: round((total / Math.max(A.labor_hours, 0.01)) * 100),
      dominant_effect: Math.abs(substitution) > Math.abs(income) ? '替代效应主导' : '收入效应主导',
      backward_bending: total < 0,
    },
    supply_curve: {
      wages: wages.map(value => round(value)),
      labor_hours: laborHours,
      backward_bending_point: turningIndex > -1
        ? { wage: round(wages[turningIndex]), labor_hours: laborHours[turningIndex] }
        : null,
    },
    textbook: {
      income_shift: '图2-9：非劳动收入增加时，预算线平行上移；闲暇是正常品时，工作时数减少。',
      wage_increase_more_work: '图2-10：工资率上升时，替代效应强于收入效应，工作时数增加。',
      wage_increase_less_work: '图2-11：工资率上升时，收入效应强于替代效应，工作时数减少。',
    },
  }
}
