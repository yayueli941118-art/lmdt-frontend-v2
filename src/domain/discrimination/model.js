const round = (value, digits = 4) => Number(value.toFixed(digits))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function transpose(matrix) {
  return matrix[0].map((_, column) => matrix.map(row => row[column]))
}

function multiply(a, b) {
  return a.map(row => b[0].map((_, column) =>
    row.reduce((sum, value, index) => sum + value * b[index][column], 0)))
}

function invert(matrix) {
  const size = matrix.length
  const augmented = matrix.map((row, index) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => Number(index === column)),
  ])
  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) return null
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]
    const divisor = augmented[column][column]
    augmented[column] = augmented[column].map(value => value / divisor)
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column]
      augmented[row] = augmented[row].map((value, index) =>
        value - factor * augmented[column][index])
    }
  }
  return augmented.map(row => row.slice(size))
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

function ols(wages, education, experience) {
  const rows = wages.map((wage, index) => [
    1,
    Number(education[index]),
    Number(experience[index]),
    Number(experience[index]) ** 2,
  ])
  const y = wages.map(value => [Math.log(Math.max(Number(value), 1))])
  const xt = transpose(rows)
  const xtxInverse = invert(multiply(xt, rows))
  if (!xtxInverse) return null
  const coefficients = multiply(multiply(xtxInverse, xt), y).map(row => row[0])
  const fitted = rows.map(row =>
    row.reduce((sum, value, index) => sum + value * coefficients[index], 0))
  const yValues = y.map(row => row[0])
  const yMean = average(yValues)
  const residualSum = yValues.reduce((sum, value, index) =>
    sum + ((value - fitted[index]) ** 2), 0)
  const totalSum = yValues.reduce((sum, value) => sum + ((value - yMean) ** 2), 0)
  return {
    coefficients,
    rSquared: totalSum <= 1e-12 ? 1 : 1 - residualSum / totalSum,
    meanX: [
      1,
      average(education.map(Number)),
      average(experience.map(Number)),
      average(experience.map(value => Number(value) ** 2)),
    ],
    meanLogWage: yMean,
  }
}

function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0)
}

function groupStats(wages, education, experience) {
  const mean = average(wages)
  return {
    mean_wage: round(mean, 2),
    median_wage: round(median(wages), 2),
    std_wage: round(Math.sqrt(average(wages.map(value => (value - mean) ** 2))), 2),
    mean_edu: round(average(education), 2),
    mean_exp: round(average(experience), 2),
    sample_size: wages.length,
  }
}

export function simulateBecker(input = {}) {
  const marketWage = Math.max(Number(input.market_wage ?? 6000), 1)
  const discriminationCoefficient = clamp(Number(input.discrimination_coefficient ?? 0.2), 0, 1)
  const demandElasticity = clamp(Math.abs(Number(input.demand_elasticity ?? 0.8)), 0.1, 3)
  const perceivedWage = marketWage * (1 + discriminationCoefficient)
  const relativeDemand = (perceivedWage / marketWage) ** (-demandElasticity)
  const coefficients = Array.from({ length: 11 }, (_, index) => index / 10)
  return {
    perceived_wage: round(perceivedWage, 2),
    relative_labor_demand_pct: round(relativeDemand * 100, 1),
    efficiency_loss_pct: round((1 - relativeDemand) * 100, 1),
    curve: coefficients.map(value => ({
      coefficient: round(value, 1),
      perceived_wage: round(marketWage * (1 + value), 2),
      labor_demand_pct: round(((1 + value) ** (-demandElasticity)) * 100, 1),
    })),
    explanation: '贝克尔模型把偏见表示为雇主感知成本中的歧视系数 d。d 越高，雇主感知工资越高，对同等生产率劳动者的需求越低。',
    model: { result_type: '教材机制模拟', formula: '感知工资=W(1+d)' },
  }
}

export function simulateStatisticalDiscrimination(input = {}) {
  const signal = Number(input.signal ?? 72)
  const groupPrior = Number(input.group_prior ?? 60)
  const signalReliability = clamp(Number(input.signal_reliability ?? 0.55), 0, 1)
  const evaluatedProductivity = signalReliability * signal + (1 - signalReliability) * groupPrior
  const reliabilityGrid = Array.from({ length: 11 }, (_, index) => index / 10)
  return {
    signal: round(signal, 1),
    group_prior: round(groupPrior, 1),
    signal_reliability: round(signalReliability, 2),
    evaluated_productivity: round(evaluatedProductivity, 1),
    prior_weight_pct: round((1 - signalReliability) * 100, 1),
    curve: reliabilityGrid.map(value => ({
      reliability: round(value, 1),
      evaluated_productivity: round(value * signal + (1 - value) * groupPrior, 1),
    })),
    explanation: '招聘者在个体信号不完全可靠时，会把个体信号与群体先验加权。群体先验只是信息不足时的判断依据，不是该个体的真实生产率。',
    model: {
      result_type: '教材机制模拟',
      formula: 'E(productivity|signal)=lambda*signal+(1-lambda)*group prior',
    },
  }
}

export function simulateDiscrimination(input = {}) {
  const wageA = (input.group_a_wages || []).map(Number)
  const wageB = (input.group_b_wages || []).map(Number)
  const eduA = (input.group_a_edu || []).map(Number)
  const eduB = (input.group_b_edu || []).map(Number)
  const expA = (input.group_a_exp || []).map(Number)
  const expB = (input.group_b_exp || []).map(Number)
  const valid = wageA.length >= 6
    && wageB.length >= 6
    && [eduA, expA].every(values => values.length === wageA.length)
    && [eduB, expB].every(values => values.length === wageB.length)
  if (!valid) {
    return {
      error: '每组至少需要 6 条工资、教育和经验完整样本。',
      model: { result_type: '用户导入样本统计' },
    }
  }
  const modelA = ols(wageA, eduA, expA)
  const modelB = ols(wageB, eduB, expB)
  if (!modelA || !modelB) {
    return {
      error: '样本变量缺少变化，无法估计回归系数。',
      model: { result_type: '用户导入样本统计' },
    }
  }
  const names = ['常数项', '受教育年限', '工作经验', '经验平方']
  const xDifference = modelB.meanX.map((value, index) => value - modelA.meanX[index])
  const betaDifference = modelB.coefficients.map((value, index) => value - modelA.coefficients[index])
  const endowmentByVariable = xDifference.map((value, index) => value * modelA.coefficients[index])
  const coefficientByVariable = modelA.meanX.map((value, index) => value * betaDifference[index])
  const interactionByVariable = xDifference.map((value, index) => value * betaDifference[index])
  const endowment = dot(xDifference, modelA.coefficients)
  const coefficient = dot(modelA.meanX, betaDifference)
  const interaction = dot(xDifference, betaDifference)
  const totalGap = modelB.meanLogWage - modelA.meanLogWage
  const explainedShare = clamp(Math.abs(endowment) / Math.max(Math.abs(totalGap), 1e-8) * 100, 0, 100)
  return {
    model: {
      name: '两组明瑟回归与三重 Oaxaca-Blinder 分解',
      formula: 'ΔlnW=(X_B-X_A)β_A+X_A(β_B-β_A)+(X_B-X_A)(β_B-β_A)',
      result_type: '用户输入样本回归',
    },
    decomposition: {
      total_gap_ln: round(totalGap),
      total_gap_pct: round((Math.exp(totalGap) - 1) * 100, 2),
      endowment_effect: round(endowment),
      coefficient_effect: round(coefficient),
      interaction_effect: round(interaction),
      explained_pct: round(explainedShare, 1),
      unexplained_pct: round(100 - explainedShare, 1),
      gap_direction: totalGap > 0 ? 'B组相对A组更高' : 'A组相对B组更高',
    },
    by_variable: names.map((variable, index) => ({
      variable,
      endowment: round(endowmentByVariable[index]),
      coefficient: round(coefficientByVariable[index]),
      interaction: round(interactionByVariable[index]),
      total: round(
        endowmentByVariable[index]
        + coefficientByVariable[index]
        + interactionByVariable[index],
      ),
    })),
    coefficients: {
      group_a: modelA.coefficients.map(value => round(value)),
      group_b: modelB.coefficients.map(value => round(value)),
      coefficient_names: names,
      r_squared_a: round(modelA.rSquared, 3),
      r_squared_b: round(modelB.rSquared, 3),
    },
    group_a: groupStats(wageA, eduA, expA),
    group_b: groupStats(wageB, eduB, expB),
  }
}
