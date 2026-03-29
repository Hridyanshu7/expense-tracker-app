import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { FilterState, AnalyticsSummary, CategorySpend, MerchantSummary, TimelinePoint, MonthlyIncomeExpense } from '@/types'

function dateParams(filters: FilterState) {
  return {
    from: format(filters.dateRange.from, 'yyyy-MM-dd'),
    to: format(filters.dateRange.to, 'yyyy-MM-dd'),
  }
}

export function useMonthlySpend(year: number, month: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['analytics', 'monthly-spend', year, month, user?.id],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const to = format(new Date(year, month, 0), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount_inr, amount')
        .eq('user_id', user!.id)
        .gte('date', from)
        .lte('date', to)

      if (error) throw error

      let totalDebit = 0
      let totalCredit = 0

      for (const t of data) {
        const amt = t.amount_inr ?? t.amount
        if (t.type === 'debit') totalDebit += amt
        else totalCredit += amt
      }

      return {
        totalDebit,
        totalCredit,
        net: totalCredit - totalDebit,
        transactionCount: data.length,
        currency: 'INR',
      }
    },
    enabled: !!user,
  })
}

export function useCategoryBreakdown(filters: FilterState) {
  const { user } = useAuth()
  const { from, to } = dateParams(filters)

  return useQuery({
    queryKey: ['analytics', 'category-breakdown', filters, user?.id],
    queryFn: async (): Promise<CategorySpend[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount_inr, amount, category:categories!category_id(id, name, color, icon)')
        .eq('user_id', user!.id)
        .eq('type', 'debit')
        .gte('date', from)
        .lte('date', to)

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totals = new Map<string, { category: any; total: number; count: number }>()

      for (const t of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cat = (t.category as unknown) as { id: string; name: string; color: string | null; icon: string | null } | null
        const key = cat?.id ?? 'uncategorized'
        const amt = t.amount_inr ?? t.amount
        const existing = totals.get(key)
        if (existing) {
          existing.total += amt
          existing.count += 1
        } else {
          totals.set(key, {
            category: cat ?? { id: 'uncategorized', name: 'Uncategorized', color: null, icon: null },
            total: amt,
            count: 1,
          })
        }
      }

      const grandTotal = Array.from(totals.values()).reduce((s, v) => s + v.total, 0)

      return Array.from(totals.values())
        .map((v) => ({
          category: { ...v.category, parent_id: null, is_system: false, created_at: '' },
          total: v.total,
          count: v.count,
          percentage: grandTotal > 0 ? (v.total / grandTotal) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)
    },
    enabled: !!user,
  })
}

export function useMerchantSummary(filters: FilterState) {
  const { user } = useAuth()
  const { from, to } = dateParams(filters)

  return useQuery({
    queryKey: ['analytics', 'merchant-summary', filters, user?.id],
    queryFn: async (): Promise<MerchantSummary[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('merchant, amount_inr, amount, date')
        .eq('user_id', user!.id)
        .eq('type', 'debit')
        .gte('date', from)
        .lte('date', to)
        .not('merchant', 'is', null)

      if (error) throw error

      const map = new Map<string, { total: number; count: number; lastDate: string }>()
      for (const t of data) {
        const merchant = t.merchant ?? 'Unknown'
        const amt = t.amount_inr ?? t.amount
        const existing = map.get(merchant)
        if (existing) {
          existing.total += amt
          existing.count += 1
          if (t.date > existing.lastDate) existing.lastDate = t.date
        } else {
          map.set(merchant, { total: amt, count: 1, lastDate: t.date })
        }
      }

      return Array.from(map.entries())
        .map(([merchant, v]) => ({
          merchant,
          total: v.total,
          count: v.count,
          avgAmount: v.total / v.count,
          lastDate: v.lastDate,
        }))
        .sort((a, b) => b.total - a.total)
    },
    enabled: !!user,
  })
}

export function useSpendingTimeline(filters: FilterState, granularity: 'day' | 'week' | 'month' = 'day') {
  const { user } = useAuth()
  const { from, to } = dateParams(filters)

  return useQuery({
    queryKey: ['analytics', 'timeline', filters, granularity, user?.id],
    queryFn: async (): Promise<TimelinePoint[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('date, type, amount_inr, amount')
        .eq('user_id', user!.id)
        .gte('date', from)
        .lte('date', to)
        .order('date')

      if (error) throw error

      const map = new Map<string, { debit: number; credit: number }>()

      for (const t of data) {
        let key = t.date
        if (granularity === 'month') key = t.date.slice(0, 7)
        else if (granularity === 'week') {
          const d = new Date(t.date)
          const weekStart = new Date(d)
          weekStart.setDate(d.getDate() - d.getDay())
          key = format(weekStart, 'yyyy-MM-dd')
        }

        const amt = t.amount_inr ?? t.amount
        const existing = map.get(key) ?? { debit: 0, credit: 0 }
        if (t.type === 'debit') existing.debit += amt
        else existing.credit += amt
        map.set(key, existing)
      }

      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }))
    },
    enabled: !!user,
  })
}

export function useIncomeExpenseSummary(year: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['analytics', 'income-expense', year, user?.id],
    queryFn: async (): Promise<MonthlyIncomeExpense[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('date, type, amount_inr, amount')
        .eq('user_id', user!.id)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)

      if (error) throw error

      const map = new Map<string, { income: number; expense: number }>()
      for (let m = 1; m <= 12; m++) {
        map.set(`${year}-${String(m).padStart(2, '0')}`, { income: 0, expense: 0 })
      }

      for (const t of data) {
        const month = t.date.slice(0, 7)
        const amt = t.amount_inr ?? t.amount
        const existing = map.get(month)
        if (!existing) continue
        if (t.type === 'credit') existing.income += amt
        else existing.expense += amt
      }

      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v, net: v.income - v.expense }))
    },
    enabled: !!user,
  })
}
