import { describe, expect, it } from 'vitest'
import { parseCsv } from './csv'

describe('CSV parser', () => {
  it('parses quoted commas and keeps missing cells empty', () => {
    const result = parseCsv('period,region,note\n2025,"成都,重庆",\n')
    expect(result.rows[0].region).toBe('成都,重庆')
    expect(result.rows[0].note).toBe('')
    expect(result.errors).toHaveLength(0)
  })

  it('reports rows with a different column count', () => {
    const result = parseCsv('period,value\n2024,10,extra')
    expect(result.errors[0].code).toBe('COLUMN_COUNT')
  })
})
