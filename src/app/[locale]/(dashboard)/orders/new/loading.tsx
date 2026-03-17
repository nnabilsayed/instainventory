import { Skeleton } from '@/components/ui/skeleton'

export default function NewOrderLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4"
      >
        <Skeleton className="h-4 w-20" />

        <div className="grid grid-cols-2 gap-1">
          <Skeleton className="h-10 rounded-[var(--radius-md)]" />
          <Skeleton className="h-10 rounded-[var(--radius-md)]" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        </div>
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4"
      >
        <Skeleton className="h-4 w-24" />

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-11 rounded-[var(--radius-md)]" />
            <Skeleton className="h-11 flex-1 rounded-[var(--radius-md)]" />
            <Skeleton className="h-11 w-11 rounded-[var(--radius-md)]" />
          </div>
        </div>

        <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4"
      >
        <Skeleton className="h-4 w-28" />

        <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />

        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
          <div
            className="flex justify-between pt-2
            border-t border-[var(--border)]"
          >
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 rounded-[var(--radius-md)]" />
            ))}
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-[var(--radius-md)]" />
      </div>
    </div>
  )
}
