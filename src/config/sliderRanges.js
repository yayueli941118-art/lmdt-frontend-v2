export const sliderRanges = {
  demandInitialWage: { min: 20, max: 140, step: 1, default: 55 },
  unemploymentBenefit: { min: 1000, max: 6000, step: 100, default: 2500 },
  employment: { min: 100, max: 5000, step: 10, default: 870 },
  tourismSalary: { min: 3000, max: 15000, step: 100, default: 7800 },
}

export function isSliderDefaultReachable({ min, max, step, default: value }) {
  if (value < min || value > max || step <= 0) return false
  const quotient = (value - min) / step
  return Math.abs(quotient - Math.round(quotient)) < 1e-8
}
