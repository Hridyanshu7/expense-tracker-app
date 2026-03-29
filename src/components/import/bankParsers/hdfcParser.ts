import type { ParsedCSVRow } from '@/types'
import { parseDate, toISODateString } from '@/utils/dateHelpers'

// HDFC CSV columns: Date | Narration | Value Date | Debit Amount | Credit Amount | Chq/Ref Number | Closing Balance
// Date format: DD/MM/YY

export function parseHDFC(rows: string[][]): ParsedCSVRow[] {
  const results: ParsedCSVRow[] = []

  for (const row of rows) {
    if (row.length < 5) continue

    const rawDate = row[0]?.trim()
    const narration = row[1]?.trim()
    const debitStr = row[3]?.trim().replace(/,/g, '')
    const creditStr = row[4]?.trim().replace(/,/g, '')

    if (!rawDate || !narration) continue

    let date: string
    try {
      date = toISODateString(parseDate(rawDate, 'dd/MM/yy'))
    } catch {
      try {
        date = toISODateString(parseDate(rawDate, 'dd/MM/yyyy'))
      } catch {
        continue
      }
    }

    const debit = parseFloat(debitStr)
    const credit = parseFloat(creditStr)

    if (isNaN(debit) && isNaN(credit)) continue

    const isDebit = !isNaN(debit) && debit > 0

    results.push({
      date,
      amount: isDebit ? debit : credit,
      type: isDebit ? 'debit' : 'credit',
      raw_narration: narration,
      currency: 'INR',
      method: 'net_banking',
      bank: 'hdfc',
    })
  }

  return results
}
