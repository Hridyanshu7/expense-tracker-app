// Mirrors the seed data in supabase/migrations/001_initial_schema.sql
// Used as a client-side fallback before Supabase data loads.

export interface DefaultCategory {
  name: string
  icon: string
  color: string
  is_system: boolean
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Food & Dining',    icon: 'utensils',      color: '#f97316', is_system: true },
  { name: 'Shopping',         icon: 'shopping-bag',  color: '#8b5cf6', is_system: true },
  { name: 'Transport',        icon: 'car',           color: '#3b82f6', is_system: true },
  { name: 'Entertainment',    icon: 'tv',            color: '#ec4899', is_system: true },
  { name: 'Health',           icon: 'heart-pulse',   color: '#ef4444', is_system: true },
  { name: 'Education',        icon: 'graduation-cap', color: '#06b6d4', is_system: true },
  { name: 'Utilities',        icon: 'zap',           color: '#eab308', is_system: true },
  { name: 'Travel',           icon: 'plane',         color: '#14b8a6', is_system: true },
  { name: 'Finance',          icon: 'landmark',      color: '#64748b', is_system: true },
  { name: 'Income',           icon: 'trending-up',   color: '#22c55e', is_system: true },
  { name: 'Transfer',         icon: 'arrow-left-right', color: '#94a3b8', is_system: true },
  { name: 'Other',            icon: 'more-horizontal', color: '#a1a1aa', is_system: true },
]

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.name, c.color]),
)
