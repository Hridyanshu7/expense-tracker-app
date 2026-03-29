import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts'
import { useSpendingTimeline } from '@/hooks/useAnalytics'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import type { FilterState } from '@/types'

interface SpendingTimelineChartProps {
  filters: FilterState
}

type Granularity = 'day' | 'week' | 'month'

export function SpendingTimelineChart({ filters }: SpendingTimelineChartProps) {
  const [granularity, setGranularity] = useState<Granularity>('day')
  const { data = [], isLoading } = useSpendingTimeline(filters, granularity)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (data.length === 0) return <EmptyState title="No data for this period" />

  return (
    <div className="space-y-4">
      <div className="flex gap-1 w-fit rounded-lg border p-1">
        {(['day', 'week', 'month'] as Granularity[]).map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
              granularity === g
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="debitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => formatDate(v, granularity === 'month' ? 'MMM' : 'dd MMM')}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => formatCurrency(v, 'INR', { compact: true, showSymbol: false })}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), '']}
              labelFormatter={(l: string) => formatDate(l, 'dd MMM yyyy')}
            />
            <Area
              type="monotone"
              dataKey="debit"
              name="Expenses"
              stroke="hsl(var(--primary))"
              fill="url(#debitGrad)"
              strokeWidth={2}
            />
            <Brush dataKey="date" height={20} stroke="hsl(var(--border))" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
