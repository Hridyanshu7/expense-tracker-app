import Papa from 'papaparse'
import type { Transaction } from '@/types'
import { formatDate } from './formatters'

/**
 * Converts a transaction array to a CSV file and triggers browser download.
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  filename = `transactions-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`,
): void {
  const rows = transactions.map((t) => ({
    Date: t.date,
    Merchant: t.merchant ?? '',
    Amount: t.amount,
    Currency: t.currency,
    'Amount (INR)': t.amount_inr ?? t.amount,
    Type: t.type,
    Method: t.method ?? '',
    Category: t.category?.name ?? '',
    Tags: t.tags.join(', '),
    Note: t.note ?? '',
    'Raw Narration': t.raw_narration ?? '',
  }))

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}
