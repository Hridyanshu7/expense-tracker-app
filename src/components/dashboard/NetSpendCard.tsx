import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMonthlySpend } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'

interface NetSpendCardProps {
  year: number
  month: number
}

export function NetSpendCard({ year, month }: NetSpendCardProps) {
  const { data: current, isLoading: currentLoading } = useMonthlySpend(year, month)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const { data: prev } = useMonthlySpend(prevYear, prevMonth)

  const change = current && prev && prev.totalDebit > 0
    ? ((current.totalDebit - prev.totalDebit) / prev.totalDebit) * 100
    : null

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="text-sm font-medium text-muted-foreground">This month's spend</div>

      {currentLoading ? (
        <div className="mt-4 flex justify-center"><Spinner /></div>
      ) : (
        <>
          <div className="mt-2 text-3xl font-bold">
            {formatCurrency(current?.totalDebit ?? 0)}
          </div>

          {change !== null && (
            <div className={`mt-1 flex items-center gap-1 text-sm ${change > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(change).toFixed(1)}% vs last month
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
            <div>
              <div className="text-muted-foreground">Income</div>
              <div className="font-semibold text-green-600">
                +{formatCurrency(current?.totalCredit ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Transactions</div>
              <div className="font-semibold">{current?.transactionCount ?? 0}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
