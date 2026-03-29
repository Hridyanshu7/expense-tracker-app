import type { ParsedCSVRow, Transaction } from '@/types'

function normalizeNarration(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim()
}

/**
 * Given incoming parsed rows and existing transactions,
 * returns a Set of indices (0-based) in `incoming` that are likely duplicates.
 *
 * A duplicate is defined as: same date + same amount + same transaction type
 * + narration similarity > threshold.
 */
export function findDuplicateIndices(
  incoming: ParsedCSVRow[],
  existing: Transaction[],
): Set<number> {
  const duplicates = new Set<number>()

  // Build a quick lookup of existing transactions
  // Key: "YYYY-MM-DD|amount|type"
  const existingMap = new Map<string, string[]>()
  for (const txn of existing) {
    const key = `${txn.date}|${txn.amount}|${txn.type}`
    const narrations = existingMap.get(key) ?? []
    if (txn.raw_narration) narrations.push(normalizeNarration(txn.raw_narration))
    existingMap.set(key, narrations)
  }

  for (let i = 0; i < incoming.length; i++) {
    const row = incoming[i]
    const key = `${row.date}|${row.amount}|${row.type}`
    const existingNarrations = existingMap.get(key)

    if (!existingNarrations) continue

    const incomingNorm = normalizeNarration(row.raw_narration)

    // Exact match on normalized narration
    if (existingNarrations.some((n) => n === incomingNorm)) {
      duplicates.add(i)
      continue
    }

    // Partial match — first 20 chars overlap (handles truncated narrations)
    const prefix = incomingNorm.slice(0, 20)
    if (prefix.length >= 10 && existingNarrations.some((n) => n.startsWith(prefix))) {
      duplicates.add(i)
    }
  }

  return duplicates
}
