import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subMonths, startOfYear,
  endOfDay, startOfDay,
} from 'date-fns'
import type { DateRangePreset, DateRange, FilterState } from '@/types'

export interface PresetConfig {
  id: DateRangePreset
  label: string
  getRange: () => DateRange
}

export const DATE_RANGE_PRESETS: PresetConfig[] = [
  {
    id: 'this_week',
    label: 'This week',
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    id: 'this_month',
    label: 'This month',
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    id: 'last_3m',
    label: 'Last 3 months',
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: endOfDay(new Date()),
    }),
  },
  {
    id: 'last_6m',
    label: 'Last 6 months',
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    id: 'ytd',
    label: 'Year to date',
    getRange: () => ({
      from: startOfYear(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    id: 'custom',
    label: 'Custom range',
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
]

export function getDefaultFilterState(): FilterState {
  const preset = DATE_RANGE_PRESETS.find((p) => p.id === 'this_month')!
  return {
    preset: 'this_month',
    dateRange: preset.getRange(),
    categoryIds: [],
    methods: [],
    currencies: [],
    amountMin: null,
    amountMax: null,
    tags: [],
  }
}
