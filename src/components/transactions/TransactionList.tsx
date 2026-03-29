import { Pencil } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { formatCurrency, formatRelativeDate } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import type { Transaction } from '@/types'

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  onEdit: (txn: Transaction) => void
}

export function TransactionList({ transactions, loading, onEdit }: TransactionListProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="Try adjusting your filters or add a new transaction."
      />
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((txn) => (
        <div
          key={txn.id}
          className="flex items-center gap-3 rounded-xl border bg-card p-4"
        >
          {/* Category color dot */}
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: txn.category?.color ?? '#94a3b8' }}
          />

          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {txn.merchant ?? txn.raw_narration ?? '—'}
              </span>
              <span className={`shrink-0 text-sm font-bold ${
                txn.type === 'debit' ? '' : 'text-green-600'
              }`}>
                {txn.type === 'debit' ? '−' : '+'}
                {formatCurrency(txn.amount, txn.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CategoryBadge category={txn.category} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatRelativeDate(txn.date)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onEdit(txn)}
            className="shrink-0 rounded p-1.5 hover:bg-accent"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  )
}
