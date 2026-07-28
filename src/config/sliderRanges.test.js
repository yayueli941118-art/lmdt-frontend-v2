import { describe, expect, it } from 'vitest'
import { isSliderDefaultReachable, sliderRanges } from './sliderRanges'

describe('slider defaults', () => {
  it.each(Object.entries(sliderRanges))('%s default is reachable from its slider', (_, config) => {
    expect(isSliderDefaultReachable(config)).toBe(true)
  })
})
