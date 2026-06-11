interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export default function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const baseClass = 'skeleton animate-shimmer'

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: width || 40, height: height || 40 }}
      />
    )
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`${baseClass} rounded-2xl ${className}`}
        style={{ width, height }}
      />
    )
  }

  return (
    <div
      className={`${baseClass} h-4 w-full ${className}`}
      style={{ width, height }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <Skeleton className="h-3 w-40" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-3xl overflow-hidden shadow-card">
      <Skeleton variant="rectangular" height={160} className="w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-full" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>
    </div>
  )
}
