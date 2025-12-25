interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-[#E9E2D7] rounded animate-pulse mb-2 last:mb-0"
            style={{ width: i === lines - 1 ? '75%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`bg-[#E9E2D7] rounded animate-pulse ${className}`}
      aria-label="Loading..."
    />
  )
}

export function MenuCardSkeleton() {
  return (
    <div className="card">
      <Skeleton className="aspect-[4/3] w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton lines={2} />
    </div>
  )
}

export function OrderRowSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

