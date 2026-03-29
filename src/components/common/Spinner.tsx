import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  className?: string
}

export function Spinner({ size = 'md', fullPage = false, className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-muted border-t-primary',
        sizeClasses[size],
        className,
      )}
    />
  )

  if (fullPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}
