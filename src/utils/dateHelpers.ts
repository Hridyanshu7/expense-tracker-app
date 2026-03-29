import { parse, format, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Parses a date string using the given date-fns format string.
 * Returns a Date object or throws on failure.
 */
export function parseDate(dateStr: string, fmt: string): Date {
  const trimmed = dateStr.trim()
  const parsed = parse(trimmed, fmt, new Date())
  if (isNaN(parsed.getTime())) {
    throw new Error(`Cannot parse date "${trimmed}" with format "${fmt}"`)
  }
  return parsed
}

/**
 * Converts any date to a consistent YYYY-MM-DD string for DB storage.
 */
export function toISODateString(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM-dd')
}

/**
 * Returns the from/to boundaries of a calendar month.
 */
export function getMonthRange(year: number, month: number): { from: Date; to: Date } {
  const d = new Date(year, month - 1, 1)
  return { from: startOfMonth(d), to: endOfMonth(d) }
}

/**
 * Formats a YYYY-MM string for display e.g. "Mar 2026"
 */
export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  return format(new Date(year, month - 1, 1), 'MMM yyyy')
}
