export type CsvCell = string | number

function escapeCell(value: CsvCell) {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: CsvCell[][]) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

/** Builds a CSV in the browser and triggers a file download. */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  // BOM so spreadsheet apps detect UTF-8.
  const blob = new Blob(['﻿', toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
