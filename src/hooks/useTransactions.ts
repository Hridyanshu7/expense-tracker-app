import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Transaction, FilterState } from '@/types'
import { format } from 'date-fns'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: FilterState): any {
  const from = format(filters.dateRange.from, 'yyyy-MM-dd')
  const to = format(filters.dateRange.to, 'yyyy-MM-dd')

  query = query.gte('date', from).lte('date', to)

  if (filters.categoryIds.length > 0) {
    query = query.in('category_id', filters.categoryIds)
  }
  if (filters.methods.length > 0) {
    query = query.in('method', filters.methods)
  }
  if (filters.currencies.length > 0) {
    query = query.in('currency', filters.currencies)
  }
  if (filters.amountMin !== null) {
    query = query.gte('amount', filters.amountMin)
  }
  if (filters.amountMax !== null) {
    query = query.lte('amount', filters.amountMax)
  }

  return query
}

export function useTransactions(filters: FilterState) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from('transactions')
        .select('*, category:categories!category_id(*), subcategory:categories!subcategory_id(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      query = applyFilters(query, filters)

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!user,
  })
}

export function useRecentTransactions(limit = 10) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories!category_id(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!user,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (txn: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'subcategory'>) => {
      const { error } = await supabase
        .from('transactions')
        .insert({ ...txn, user_id: user!.id })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useBulkInsertTransactions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (
      txns: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'subcategory'>[],
    ) => {
      const { error } = await supabase
        .from('transactions')
        .insert(txns.map((t) => ({ ...t, user_id: user!.id })))

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
