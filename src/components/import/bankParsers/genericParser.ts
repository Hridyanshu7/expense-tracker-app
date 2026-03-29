import type { ParsedCSVRow, ColumnConfig } from '@/types'
import { parse } from 'date-fns'
import { toISODateString } from '@/utils/dateHelpers'

const DATE_FORMATS = [
  'dd/MM/yy',
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'dd MMM yyyy',
  'dd-MMM-yyyy',
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'd/M/yyyy',
  'd-M-yyyy',
]

/**
 * Tries each known date format against a sample of values from a column.
 * Returns the format that successfully parses the most values.
 */
export function autoDetectDateFormat(samples: string[]): string {
  const nonEmpty = samples.filter((s) => s.trim().length > 0).slice(0, 10)
  if (nonEmpty.length === 0) return 'dd/MM/yyyy'

  let best = { format: 'dd/MM/yyyy', score: 0 }

  for (const fmt of DATE_FORMATS) {
    const score = nonEmpty.filter((s) => {
      try {
        const d = parse(s.trim(), fmt, new Date())
        return !isNaN(d.getTime()) && d.getFullYear() > 2000
      } catch {
        return false
      }
    }).length

    if (score > best.score) {
      best = { format: fmt, score }
    }
  }

  return best.format
}

/**
 * Parses any CSV rows using the user-supplied column configuration.
 */
export function parseGeneric(rows: string[][], config: ColumnConfig, headers: string[]): ParsedCSVRow[] {
  const results: ParsedCSVRow[] = []

  const colIndex = (name: string) => headers.findIndex(
    (h) => h.trim().toLowerCase() === name.trim().toLowerCase()
  )

  const dateIdx = colIndex(config.dateColumn)
  const narrationIdx = colIndex(config.narrationColumn)

  if (dateIdx === -1 || narrationIdx === -1) return results

  const debitIdx = config.debitColumn ? colIndex(config.debitColumn) : -1
  const creditIdx = config.creditColumn ? colIndex(config.creditColumn) : -1
  const amountIdx = config.amountColumn ? colIndex(config.amountColumn) : -1
  const typeIdx = config.typeColumn ? colIndex(config.typeColumn) : -1

  for (const row of rows) {
    if (row.length <= Math.max(dateIdx, narrationIdx)) continue

    const rawDate = row[dateIdx]?.trim()
    const narration = row[narrationIdx]?.trim()

    if (!rawDate || !narration) continue

    // Parse date
    let date: string
    try {
      date = toISODateString(parse(rawDate, config.dateFormat, new Date()))
      if (isNaN(new Date(date).getTime())) continue
    } catch {
      continue
    }

    let amount = 0
    let type: 'debit' | 'credit' = 'debit'

    if (config.amountMode === 'split') {
      // Separate debit / credit columns
      const debitStr = debitIdx >= 0 ? row[debitIdx]?.trim().replace(/,/g, '') : ''
      const creditStr = creditIdx >= 0 ? row[creditIdx]?.trim().replace(/,/g, '') : ''
      const debit = parseFloat(debitStr)
      const credit = parseFloat(creditStr)

      if (isNaN(debit) && isNaN(credit)) continue
      if (!isNaN(debit) && debit > 0) {
        amount = debit
        type = 'debit'
      } else if (!isNaN(credit) && credit > 0) {
        amount = credit
        type = 'credit'
      } else {
        continue
      }
    } else {
      // Single amount column
      const amountStr = amountIdx >= 0 ? row[amountIdx]?.trim().replace(/,/g, '') : ''
      const raw = parseFloat(amountStr)
      if (isNaN(raw)) continue

      if (typeIdx >= 0) {
        // Use type indicator column
        const typeVal = row[typeIdx]?.trim() ?? ''
        const isDebit = config.typeDebitValues.some(
          (v) => v.toLowerCase() === typeVal.toLowerCase()
        )
        type = isDebit ? 'debit' : 'credit'
        amount = Math.abs(raw)
      } else {
        // Negative = debit, positive = credit (or just treat all as debit)
        type = raw < 0 ? 'debit' : 'credit'
        amount = Math.abs(raw)
      }
    }

    if (amount <= 0) continue

    results.push({
      date,
      amount,
      type,
      raw_narration: narration,
      currency: 'INR',
      method: 'other',
      bank: 'generic',
    })
  }

  return results
}
