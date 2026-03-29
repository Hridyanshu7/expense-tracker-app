import type { ParsedCSVRow } from '@/types'
import { parseDate, toISODateString } from '@/utils/dateHelpers'

// SBI columns: Txn Date | Value Date | Description | Ref No/Chq No | Debit | Credit | Balance
// Date format: dd MMM yyyy  (e.g. "01 Jan 2025")

export function parseSBI(rows: string[][]): ParsedCSVRow[] {
  const results: ParsedCSVRow[] = []

  for (const row of rows) {
    if (row.length < 6) continue

    const rawDate = row[0]?.trim()
    const description = row[2]?.trim()
    const debitStr = row[4]?.trim().replace(/,/g, '')
    const creditStr = row[5]?.trim().replace(/,/g, '')

    if (!rawDate || !description) continue

    let date: string
    try {
      date = toISODateString(parseDate(rawDate, 'dd MMM yyyy'))
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
      raw_narration: description,
      currency: 'INR',
      method: 'net_banking',
      bank: 'sbi',
    })
  }

  return results
}
