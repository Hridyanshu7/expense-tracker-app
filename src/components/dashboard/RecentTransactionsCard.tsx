import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useRecentTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatRelativeDate } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'

export function RecentTransactionsCard() {
  const { data: transactions = [], isLoading } = useRecentTransactions(8)

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">Recent transactions</div>
        <Link
          to="/transactions"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add transactions manually or import a CSV statement."
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{txn.merchant ?? txn.raw_narration ?? '—'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(txn.date)}
                  {txn.category && ` · ${txn.category.name}`}
                </span>
              </div>
              <span
                className={`text-sm font-semibold ${
                  txn.type === 'debit' ? 'text-foreground' : 'text-green-600'
                }`}
              >
                {txn.type === 'debit' ? '−' : '+'}
                {formatCurrency(txn.amount, txn.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
