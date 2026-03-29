import { Pencil, Trash2 } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { formatCurrency, formatDate, formatPaymentMethod } from '@/utils/formatters'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import { toast } from 'sonner'
import type { Transaction } from '@/types'

interface TransactionTableProps {
  transactions: Transaction[]
  loading: boolean
  onEdit: (txn: Transaction) => void
}

export function TransactionTable({ transactions, loading, onEdit }: TransactionTableProps) {
  const { mutate: deleteTransaction } = useDeleteTransaction()

  function handleDelete(txn: Transaction) {
    if (!confirm(`Delete transaction "${txn.merchant ?? txn.raw_narration}"?`)) return
    deleteTransaction(txn.id, {
      onSuccess: () => toast.success('Transaction deleted'),
      onError: () => toast.error('Failed to delete transaction'),
    })
  }

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
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Merchant</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {transactions.map((txn) => (
            <tr key={txn.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 text-muted-foreground">{formatDate(txn.date, 'dd MMM')}</td>
              <td className="max-w-[200px] px-4 py-3">
                <div className="truncate font-medium">{txn.merchant ?? '—'}</div>
                {txn.raw_narration && txn.merchant !== txn.raw_narration && (
                  <div className="truncate text-xs text-muted-foreground">{txn.raw_narration}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <CategoryBadge category={txn.category} size="sm" />
              </td>
              <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                txn.type === 'debit' ? '' : 'text-green-600'
              }`}>
                {txn.type === 'debit' ? '−' : '+'}
                {formatCurrency(txn.amount, txn.currency)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatPaymentMethod(txn.method)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(txn)}
                    className="rounded p-1 hover:bg-accent"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(txn)}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
