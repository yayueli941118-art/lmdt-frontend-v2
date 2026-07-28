import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

const forbidden = [
  '西南交通大学希望学院',
  '黎雅月',
  '课程负责人 / 系统设计',
  'yayueli941118-art',
  'LMDT',
]

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  }))
  return nested.flat()
}

const files = (await filesUnder('dist')).filter(path =>
  ['.html', '.js', '.css', '.json', '.svg'].includes(extname(path)))
const findings = []
for (const file of files) {
  const content = await readFile(file, 'utf8')
  for (const phrase of forbidden) {
    if (content.includes(phrase)) findings.push(`${file}: ${phrase}`)
  }
}

if (findings.length) {
  console.error('匿名构建发现身份信息：')
  console.error(findings.join('\n'))
  process.exit(1)
}

console.log(`匿名构建扫描通过：检查 ${files.length} 个文本资源。`)
