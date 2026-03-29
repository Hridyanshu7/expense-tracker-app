import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useIncomeExpenseSummary } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/utils/formatters'
import { formatYearMonth } from '@/utils/dateHelpers'
import { Spinner } from '@/components/common/Spinner'

interface IncomeExpenseSummaryProps {
  year: number
}

export function IncomeExpenseSummary({ year }: IncomeExpenseSummaryProps) {
  const { data = [], isLoading } = useIncomeExpenseSummary(year)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const chartData = data.map((d) => ({
    ...d,
    label: formatYearMonth(d.month),
  }))

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">{year} — Income vs Expenses</div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => formatCurrency(v, 'INR', { compact: true, showSymbol: false })}
            />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
