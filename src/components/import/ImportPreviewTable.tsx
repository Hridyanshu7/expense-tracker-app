import { AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useCategories } from '@/hooks/useCategories'
import type { ImportPreviewRow } from '@/types'

interface ImportPreviewTableProps {
  rows: ImportPreviewRow[]
  onToggleRow: (index: number) => void
  onUpdateCategory: (index: number, categoryId: string) => void
  onBack: () => void
  onConfirm: () => void
  importing: boolean
}

export function ImportPreviewTable({
  rows, onToggleRow, onUpdateCategory, onBack, onConfirm, importing
}: ImportPreviewTableProps) {
  const { data: categories = [] } = useCategories()
  const selectedCount = rows.filter((r) => r.selected).length
  const duplicateCount = rows.filter((r) => r.isDuplicate).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {rows.length} rows parsed · <span className="font-medium text-foreground">{selectedCount} selected</span>
          {duplicateCount > 0 && ` · ${duplicateCount} likely duplicates`}
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={importing || selectedCount === 0}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? 'Importing…' : `Import ${selectedCount}`}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left" />
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Narration</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => (
              <tr key={i} className={row.isDuplicate ? 'opacity-50' : ''}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => onToggleRow(i)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {formatDate(row.date, 'dd MMM')}
                </td>
                <td className="max-w-[240px] px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {row.isDuplicate && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" aria-label="Possible duplicate" />
                    )}
                    <span className="truncate">{row.raw_narration}</span>
                  </div>
                </td>
                <td className={`px-3 py-2 text-right font-medium tabular-nums ${row.type === 'debit' ? '' : 'text-green-600'}`}>
                  {row.type === 'debit' ? '−' : '+'}
                  {formatCurrency(row.amount, row.currency)}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.suggestedCategory?.id ?? ''}
                    onChange={(e) => onUpdateCategory(i, e.target.value)}
                    className="rounded border bg-background px-2 py-1 text-xs"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
