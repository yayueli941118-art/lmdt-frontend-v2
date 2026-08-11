function rowsFromCsv(text) {
  const matrix = []
  let row = []
  let cell = ''
  let quoted = false
  const source = String(text || '').replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell.trim())
      if (row.some(value => value !== '')) matrix.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell || row.length) {
    row.push(cell.trim())
    if (row.some(value => value !== '')) matrix.push(row)
  }
  return { matrix, unterminatedQuote: quoted }
}

export function parseCsv(text) {
  const { matrix, unterminatedQuote } = rowsFromCsv(text)
  const errors = []
  if (!matrix.length) return { headers: [], rows: [], errors: [{ code: 'EMPTY', row: 0, message: 'CSV 为空。' }] }
  const headers = matrix[0].map(value => value.trim())
  if (unterminatedQuote) errors.push({ code: 'QUOTE', row: matrix.length, message: '存在未闭合的引号。' })
  const rows = matrix.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      errors.push({ code: 'COLUMN_COUNT', row: index + 2, message: `识别到 ${values.length} 列，应为 ${headers.length} 列。` })
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']))
  })
  return { headers, rows, errors }
}

export function toCsv(rows = [], headers = Object.keys(rows[0] || {})) {
  const escape = value => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers.join(','), ...rows.map(row => headers.map(header => escape(row[header])).join(','))].join('\r\n')
}
