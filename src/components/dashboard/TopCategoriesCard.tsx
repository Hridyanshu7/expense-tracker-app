import { useCategoryBreakdown } from '@/hooks/useAnalytics'
import { getDefaultFilterState } from '@/constants/filters'
import { formatCurrency } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { startOfMonth, endOfMonth } from 'date-fns'

interface TopCategoriesCardProps {
  year: number
  month: number
}

export function TopCategoriesCard({ year, month }: TopCategoriesCardProps) {
  const filters = {
    ...getDefaultFilterState(),
    dateRange: {
      from: startOfMonth(new Date(year, month - 1)),
      to: endOfMonth(new Date(year, month - 1)),
    },
  }

  const { data: categories = [], isLoading } = useCategoryBreakdown(filters)
  const top = categories.slice(0, 5)

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 text-sm font-medium text-muted-foreground">Top categories this month</div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : top.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No spend data yet</div>
      ) : (
        <div className="space-y-3">
          {top.map((item) => (
            <div key={item.category.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{item.category.name}</span>
                <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.category.color ?? '#94a3b8',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
