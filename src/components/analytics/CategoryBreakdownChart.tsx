import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCategoryBreakdown } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import type { FilterState } from '@/types'

interface CategoryBreakdownChartProps {
  filters: FilterState
}

export function CategoryBreakdownChart({ filters }: CategoryBreakdownChartProps) {
  const { data = [], isLoading } = useCategoryBreakdown(filters)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (data.length === 0) return <EmptyState title="No expense data for this period" />

  const chartData = data.map((d) => ({
    name: d.category.name,
    value: d.total,
    color: d.category.color ?? '#94a3b8',
    percentage: d.percentage,
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Table breakdown */}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.category.id} className="flex items-center gap-3">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.category.color ?? '#94a3b8' }}
            />
            <div className="flex flex-1 items-center justify-between text-sm">
              <span>{item.category.name}</span>
              <span className="font-medium">{formatCurrency(item.total)}</span>
            </div>
            <span className="w-12 text-right text-xs text-muted-foreground">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
