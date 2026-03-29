import { DATE_RANGE_PRESETS } from '@/constants/filters'
import type { FilterState, DateRangePreset } from '@/types'

interface DateRangeFilterProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function DateRangeFilter({ filters, onChange }: DateRangeFilterProps) {
  function setPreset(preset: DateRangePreset) {
    const found = DATE_RANGE_PRESETS.find((p) => p.id === preset)
    if (!found) return
    onChange({ ...filters, preset, dateRange: found.getRange() })
  }

  return (
    <div className="flex gap-1 rounded-lg border p-1 w-fit">
      {DATE_RANGE_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
        <button
          key={preset.id}
          onClick={() => setPreset(preset.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filters.preset === preset.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}
