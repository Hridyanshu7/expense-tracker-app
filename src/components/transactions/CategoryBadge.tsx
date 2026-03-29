import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface CategoryBadgeProps {
  category: Category | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

export function CategoryBadge({ category, size = 'md', className }: CategoryBadgeProps) {
  if (!category) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full bg-muted px-2 text-muted-foreground',
        size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-xs font-medium',
        className,
      )}>
        Uncategorized
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 font-medium',
        size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-xs',
        className,
      )}
      style={{
        backgroundColor: category.color ? `${category.color}20` : undefined,
        color: category.color ?? undefined,
      }}
    >
      {category.name}
    </span>
  )
}
