import { Skeleton } from '@/components/ui/skeleton'

export default function NewProductLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4"
      >
        <Skeleton className="h-3 w-28" />

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full rounded-[var(--radius-md)]" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        </div>
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4"
      >
        <Skeleton className="h-3 w-16" />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-11 rounded-[var(--radius-md)]" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-11 rounded-[var(--radius-md)]" />
          </div>
        </div>

        <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
      </div>

      <div className="flex justify-end gap-3">
        <Skeleton className="h-11 w-20 rounded-[var(--radius-md)]" />
        <Skeleton className="h-11 w-28 rounded-[var(--radius-md)]" />
      </div>
    </div>
  )
}
