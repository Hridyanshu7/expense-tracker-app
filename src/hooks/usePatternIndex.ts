import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { matchPattern } from '@/lib/patternMatcher'
import type { PatternIndex } from '@/types'

export function usePatternIndex() {
  return useQuery({
    queryKey: ['patternIndex'],
    queryFn: async (): Promise<PatternIndex[]> => {
      const { data, error } = await supabase
        .from('pattern_index')
        .select('*')
        .order('confidence', { ascending: false })

      if (error) throw error
      return data as PatternIndex[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour — patterns don't change often
  })
}

export function useUpsertPatterns() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      patterns: Omit<PatternIndex, 'id' | 'updated_at' | 'created_by'>[],
    ) => {
      const { error } = await supabase
        .from('pattern_index')
        .upsert(
          patterns.map((p) => ({ ...p, updated_at: new Date().toISOString() })),
          { onConflict: 'pattern' },
        )

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['patternIndex'] })
    },
  })
}

/** Convenience hook that combines pattern index with a match function */
export function useMatchNarration() {
  const { data: patterns = [] } = usePatternIndex()
  return (narration: string) => matchPattern(narration, patterns)
}
