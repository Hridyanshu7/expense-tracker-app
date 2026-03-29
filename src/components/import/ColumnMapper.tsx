import { useState, useEffect } from 'react'
import { Wand2 } from 'lucide-react'
import { autoDetectDateFormat } from './bankParsers/genericParser'
import type { ColumnConfig } from '@/types'

interface ColumnMapperProps {
  headers: string[]
  previewRows: string[][]     // first 3–5 data rows for live preview
  onConfirm: (config: ColumnConfig) => void
  onBack: () => void
}

export function ColumnMapper({ headers, previewRows, onConfirm, onBack }: ColumnMapperProps) {
  const [dateColumn, setDateColumn] = useState(headers[0] ?? '')
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy')
  const [narrationColumn, setNarrationColumn] = useState('')
  const [amountMode, setAmountMode] = useState<'split' | 'single'>('split')
  const [debitColumn, setDebitColumn] = useState('')
  const [creditColumn, setCreditColumn] = useState('')
  const [amountColumn, setAmountColumn] = useState('')
  const [typeColumn, setTypeColumn] = useState('')
  const [typeDebitValues, setTypeDebitValues] = useState('DR, Debit, debit, D')

  // Auto-detect date format when date column changes
  useEffect(() => {
    if (!dateColumn) return
    const colIdx = headers.indexOf(dateColumn)
    if (colIdx === -1) return
    const samples = previewRows.map((r) => r[colIdx] ?? '').filter(Boolean)
    if (samples.length > 0) setDateFormat(autoDetectDateFormat(samples))
  }, [dateColumn, headers, previewRows])

  function autoMap() {
    // Heuristic: find columns by common keywords in header names
    const find = (...keywords: string[]) =>
      headers.find((h) =>
        keywords.some((k) => h.toLowerCase().includes(k.toLowerCase()))
      ) ?? ''

    setDateColumn(find('date', 'txn', 'transaction date', 'value date') || (headers[0] ?? ''))
    setNarrationColumn(find('narration', 'description', 'particulars', 'remarks', 'details', 'merchant', 'payee'))
    const debit = find('debit', 'withdrawal', 'dr amount', 'dr')
    const credit = find('credit', 'deposit', 'cr amount', 'cr')
    const amount = find('amount')

    if (debit || credit) {
      setAmountMode('split')
      setDebitColumn(debit)
      setCreditColumn(credit)
    } else if (amount) {
      setAmountMode('single')
      setAmountColumn(amount)
      const type = find('type', 'dr/cr', 'txn type')
      setTypeColumn(type)
    }
  }

  function handleConfirm() {
    const config: ColumnConfig = {
      dateColumn,
      dateFormat,
      narrationColumn,
      amountMode,
      ...(amountMode === 'split'
        ? { debitColumn, creditColumn }
        : {
            amountColumn,
            typeColumn: typeColumn || undefined,
            typeDebitValues: typeDebitValues.split(',').map((s) => s.trim()).filter(Boolean),
          }),
      typeDebitValues: typeDebitValues.split(',').map((s) => s.trim()).filter(Boolean),
    }
    onConfirm(config)
  }

  const isValid = dateColumn && narrationColumn &&
    (amountMode === 'split' ? (debitColumn || creditColumn) : amountColumn)

  const colIdx = (name: string) => headers.indexOf(name)

  return (
    <div className="max-w-2xl space-y-6">
      {/* CSV preview */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">CSV preview</h3>
          <button
            onClick={autoMap}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Auto-detect columns
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border text-xs">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {previewRows.slice(0, 3).map((row, i) => (
                <tr key={i}>
                  {headers.map((_, j) => (
                    <td key={j} className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {row[j] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column mapping form */}
      <div className="space-y-4 rounded-xl border p-5">
        <h3 className="text-sm font-semibold">Map columns</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Date column */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Date column</label>
            <select
              value={dateColumn}
              onChange={(e) => setDateColumn(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— select —</option>
              {headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Date format */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Date format
              {dateColumn && (
                <span className="ml-1 text-muted-foreground/60">
                  (sample: {previewRows[0]?.[colIdx(dateColumn)] ?? ''})
                </span>
              )}
            </label>
            <input
              type="text"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              placeholder="dd/MM/yyyy"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              dd=day, MM=month, yy/yyyy=year, MMM=Jan
            </p>
          </div>
        </div>

        {/* Narration column */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Description / Narration column
          </label>
          <select
            value={narrationColumn}
            onChange={(e) => setNarrationColumn(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">— select —</option>
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* Amount mode */}
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Amount columns</label>
          <div className="flex gap-2">
            {(['split', 'single'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAmountMode(mode)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  amountMode === mode
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {mode === 'split' ? 'Separate Debit / Credit columns' : 'Single amount column'}
              </button>
            ))}
          </div>
        </div>

        {amountMode === 'split' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Debit / Withdrawal column</label>
              <select
                value={debitColumn}
                onChange={(e) => setDebitColumn(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Credit / Deposit column</label>
              <select
                value={creditColumn}
                onChange={(e) => setCreditColumn(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount column</label>
              <select
                value={amountColumn}
                onChange={(e) => setAmountColumn(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Negative values = expense</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Type column <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <select
                value={typeColumn}
                onChange={(e) => setTypeColumn(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">— none —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {typeColumn && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Values that mean "Debit / Expense" (comma-separated)
                </label>
                <input
                  type="text"
                  value={typeDebitValues}
                  onChange={(e) => setTypeDebitValues(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="DR, Debit, debit, D"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          Preview transactions
        </button>
      </div>
    </div>
  )
}
