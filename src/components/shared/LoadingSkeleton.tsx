import { Skeleton } from '@/components/ui/misc'

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-gray-200" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 px-5 py-4">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" style={{ maxWidth: c === 0 ? 140 : 220 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-card" aria-busy="true">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  )
}

/** Full-page placeholder: header, KPI row and a content card. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
