import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Category[]
    },
    staleTime: 1000 * 60 * 30, // categories change rarely
  })
}

export function buildCategoryTree(categories: Category[]): Category[] {
  return categories.filter((c) => c.parent_id === null)
}

export function getCategoryChildren(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parent_id === parentId)
}
