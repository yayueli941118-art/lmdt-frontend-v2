import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { parsePracticeWorkbook } from './workbookAdapter'

const templatePath = resolve('public/templates/实践一_劳动力市场指标诊断_学生Excel模板_V1.0.xlsx')

describe('实践一 Excel 适配器', () => {
  it('从正式学生模板读取版本、身份、36人人物事实和 V1 字段', async () => {
    const submission = await parsePracticeWorkbook(readFileSync(templatePath), { phase: 'v1' })

    expect(submission.versions).toEqual({
      template: 'TPL-L02-STUDENT-V1.0',
      dataset: 'DATA-L02-V1.0',
      rules: 'RULE-L02-V1.0',
    })
    expect(submission.people).toHaveLength(36)
    expect(submission.people[0]).toEqual(expect.objectContaining({
      personId: 'P01',
      age: 32,
      paidHours: 40,
      category: '',
    }))
  })
})
