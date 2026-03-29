import type { ParsedCSVRow } from '@/types'
import { parseDate, toISODateString } from '@/utils/dateHelpers'

// HDFC CSV columns: Date | Narration | Chq./Ref.No. | Value Dt | Withdrawal Amt. | Deposit Amt. | Closing Balance
// Date format: DD/MM/YY

export function parseHDFC(rows: string[][]): ParsedCSVRow[] {
  const results: ParsedCSVRow[] = []

  for (const row of rows) {
    if (row.length < 6) continue

    const rawDate = row[0]?.trim()
    const narration = row[1]?.trim()
    const debitStr = row[4]?.trim().replace(/,/g, '')   // Withdrawal Amt.
    const creditStr = row[5]?.trim().replace(/,/g, '')  // Deposit Amt.

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
