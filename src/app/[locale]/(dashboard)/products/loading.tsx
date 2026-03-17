import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-10 w-32 rounded-[var(--radius-md)]" />
      </div>

      {/* Product cards */}
      {[1,2,3,4,5].map(i => (
        <div key={i}
          className="bg-[var(--surface)] border border-[var(--border)]
            rounded-[var(--radius-lg)] px-4 py-3">
          <div className="flex items-center gap-3">

            {/* Product image placeholder */}
            <Skeleton className="w-10 h-10 rounded-[var(--radius-md)]
              flex-shrink-0" />

            {/* Product info */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>

            {/* Edit + Delete buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Skeleton className="h-8 w-14 rounded-[var(--radius-md)]" />
              <Skeleton className="h-8 w-8 rounded-[var(--radius-md)]" />
            </div>

          </div>
        </div>
      ))}

    </div>
  )
}
