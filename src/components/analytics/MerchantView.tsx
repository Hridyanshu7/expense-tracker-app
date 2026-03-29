import { useMerchantSummary } from '@/hooks/useAnalytics'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import type { FilterState } from '@/types'

interface MerchantViewProps {
  filters: FilterState
}

export function MerchantView({ filters }: MerchantViewProps) {
  const { data = [], isLoading } = useMerchantSummary(filters)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (data.length === 0) return <EmptyState title="No merchant data for this period" />

  const maxTotal = data[0]?.total ?? 1

  return (
    <div className="space-y-2">
      {data.map((merchant) => (
        <div key={merchant.merchant} className="rounded-xl border p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{merchant.merchant}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {merchant.count} transactions · avg {formatCurrency(merchant.avgAmount)} · last {formatDate(merchant.lastDate)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(merchant.total)}</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(merchant.total / maxTotal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
