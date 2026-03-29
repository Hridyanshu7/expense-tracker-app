import { X } from 'lucide-react'
import { DATE_RANGE_PRESETS } from '@/constants/filters'
import type { FilterState, DateRangePreset } from '@/types'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function setPreset(preset: DateRangePreset) {
    const found = DATE_RANGE_PRESETS.find((p) => p.id === preset)
    if (!found) return
    onChange({ ...filters, preset, dateRange: found.getRange() })
  }

  const hasActiveFilters =
    filters.categoryIds.length > 0 ||
    filters.methods.length > 0 ||
    filters.amountMin !== null ||
    filters.amountMax !== null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date presets */}
      <div className="flex gap-1 rounded-lg border p-1">
        {DATE_RANGE_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
          <button
            key={preset.id}
            onClick={() => setPreset(preset.id)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filters.preset === preset.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ ...filters, categoryIds: [], methods: [], amountMin: null, amountMax: null })}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  )
}
