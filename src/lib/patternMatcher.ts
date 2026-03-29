import type { PatternIndex, Category } from '@/types'

/**
 * Matches a raw narration string against the stored pattern index.
 * Returns the best match (highest confidence) or null if no match.
 */
export function matchPattern(
  narration: string,
  patterns: PatternIndex[],
): PatternIndex | null {
  const normalized = narration.toLowerCase().trim()

  // Sort by confidence descending, user overrides first
  const sorted = [...patterns].sort((a, b) => {
    if (a.source === 'user' && b.source !== 'user') return -1
    if (b.source === 'user' && a.source !== 'user') return 1
    return b.confidence - a.confidence
  })

  for (const entry of sorted) {
    try {
      const regex = new RegExp(entry.pattern, 'i')
      if (regex.test(normalized)) {
        return entry
      }
    } catch {
      // Skip malformed patterns
    }
  }

  return null
}

/**
 * Filters narrations that have no match in the pattern index.
 * Returns unique unmatched narrations, ready to be sent to Claude.
 */
export function extractUnmatchedNarrations(
  narrations: string[],
  patterns: PatternIndex[],
): string[] {
  const unmatched = new Set<string>()

  for (const narration of narrations) {
    if (!narration.trim()) continue
    const match = matchPattern(narration, patterns)
    if (!match) {
      unmatched.add(narration.trim())
    }
  }

  return Array.from(unmatched)
}

/**
 * Applies pattern index to an array of narrations and returns
 * a map of narration → matched PatternIndex entry.
 */
export function batchMatch(
  narrations: string[],
  patterns: PatternIndex[],
): Map<string, PatternIndex | null> {
  const result = new Map<string, PatternIndex | null>()
  for (const narration of narrations) {
    result.set(narration, matchPattern(narration, patterns))
  }
  return result
}

/**
 * Infers category from a matched pattern, given the full category list.
 */
export function inferCategory(
  match: PatternIndex | null,
  categories: Category[],
): Category | undefined {
  if (!match?.category_id) return undefined
  return categories.find((c) => c.id === match.category_id)
}
