import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-10 w-28 rounded-[var(--radius-md)]" />
      </div>

      {/* Search input */}
      <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />

      {/* Status filter chips */}
      <div className="flex gap-2">
        {[48, 36, 56, 72, 56, 64, 72].map((w, i) => (
          <Skeleton
            key={i}
            className="h-8 rounded-full flex-shrink-0"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Order cards */}
      {[1,2,3,4,5,6,7].map(i => (
        <div key={i}
          className="bg-[var(--surface)] border border-[var(--border)]
            rounded-[var(--radius-lg)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}

    </div>
  )
}
