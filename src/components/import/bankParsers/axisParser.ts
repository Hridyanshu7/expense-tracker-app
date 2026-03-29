import type { ParsedCSVRow } from '@/types'
import { parseDate, toISODateString } from '@/utils/dateHelpers'

// Axis columns: Tran Date | Particulars | Chq/Ref No | Value Date | Withdrawal | Deposit | Balance
// Date format: DD-MM-YYYY

export function parseAxis(rows: string[][]): ParsedCSVRow[] {
  const results: ParsedCSVRow[] = []

  for (const row of rows) {
    if (row.length < 6) continue

    const rawDate = row[0]?.trim()
    const particulars = row[1]?.trim()
    const withdrawalStr = row[4]?.trim().replace(/,/g, '')
    const depositStr = row[5]?.trim().replace(/,/g, '')

    if (!rawDate || !particulars) continue

    let date: string
    try {
      date = toISODateString(parseDate(rawDate, 'dd-MM-yyyy'))
    } catch {
      try {
        date = toISODateString(parseDate(rawDate, 'dd/MM/yyyy'))
      } catch {
        continue
      }
    }

    const withdrawal = parseFloat(withdrawalStr)
    const deposit = parseFloat(depositStr)

    if (isNaN(withdrawal) && isNaN(deposit)) continue

    const isDebit = !isNaN(withdrawal) && withdrawal > 0

    results.push({
      date,
      amount: isDebit ? withdrawal : deposit,
      type: isDebit ? 'debit' : 'credit',
      raw_narration: particulars,
      currency: 'INR',
      method: 'net_banking',
      bank: 'axis',
    })
  }

  return results
}
