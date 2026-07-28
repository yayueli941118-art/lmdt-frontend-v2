import { simulateDemand } from '../domain/demand/model'
import {
  simulateBecker,
  simulateDiscrimination,
  simulateStatisticalDiscrimination,
} from '../domain/discrimination/model'
import { simulateDistribution } from '../domain/distribution/model'
import { simulateHumanCapital } from '../domain/humanCapital/model'
import { simulateMigration } from '../domain/migration/model'
import { simulateSupply } from '../domain/supply/model'
import { simulateTourism } from '../domain/tourism/model'
import {
  simulateBeveridge,
  simulateDmp,
  simulateMinimumWage,
  simulateSearch,
  simulateUnemployment,
} from '../domain/unemployment/model'
import {
  simulateMincer,
  simulateWageDistribution,
  simulateWageTheory,
} from '../domain/wage/model'

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

const handlers = [
  ['/api/v2/supply/decompose', simulateSupply],
  ['/api/v2/demand/textbook', simulateDemand],
  ['/api/v2/demand/curve', simulateDemand],
  ['/api/v2/demand/factor-allocation', simulateDemand],
  ['/api/v2/macro/beveridge', simulateBeveridge],
  ['/api/v1/macro-lab/simulate', simulateBeveridge],
  ['/api/v2/macro/unemployment', simulateUnemployment],
  ['/api/v2/macro/min-wage-impact', simulateMinimumWage],
  ['/api/v2/macro/search', simulateSearch],
  ['/api/v2/macro/dmp', simulateDmp],
  ['/api/v2/wage/distribution', simulateWageDistribution],
  ['/api/v2/wage/mincer', simulateMincer],
  ['/api/v2/wage/theory', simulateWageTheory],
  ['/api/v1/individual-lab/simulate', simulateHumanCapital],
  ['/api/v2/migration/npv', simulateMigration],
  ['/api/v2/discrimination/decompose', simulateDiscrimination],
  ['/api/v2/discrimination/becker', simulateBecker],
  ['/api/v2/discrimination/statistical', simulateStatisticalDiscrimination],
  ['/api/v2/distribution/simulate', simulateDistribution],
  ['/api/v2/tourism/chengyu/simulate', simulateTourism],
]

export function offlineResponse(config) {
  const pathname = pathOf(config)
  const match = handlers.find(([path]) => pathname.endsWith(path))
  return match ? match[1](payload(config)) : null
}
