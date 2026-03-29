import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatPaymentMethod } from '@/utils/formatters'
import { Spinner } from '@/components/common/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import type { FilterState, PaymentMethod } from '@/types'

const METHOD_COLORS: Record<string, string> = {
  upi: '#3b82f6',
  credit_card: '#8b5cf6',
  debit_card: '#06b6d4',
  net_banking: '#f97316',
  cash: '#22c55e',
  other: '#94a3b8',
}

interface PaymentMethodChartProps {
  filters: FilterState
}

export function PaymentMethodChart({ filters }: PaymentMethodChartProps) {
  const { data: transactions = [], isLoading } = useTransactions(filters)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const debits = transactions.filter((t) => t.type === 'debit')
  if (debits.length === 0) return <EmptyState title="No expense data for this period" />

  const totals = new Map<string, number>()
  for (const t of debits) {
    const m = t.method ?? 'other'
    totals.set(m, (totals.get(m) ?? 0) + (t.amount_inr ?? t.amount))
  }

  const chartData = Array.from(totals.entries())
    .map(([method, value]) => ({
      name: formatPaymentMethod(method as PaymentMethod),
      value,
      color: METHOD_COLORS[method] ?? '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
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
  )
}
