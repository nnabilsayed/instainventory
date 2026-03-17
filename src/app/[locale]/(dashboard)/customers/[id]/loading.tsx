import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Skeleton className="h-4 w-24" />

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center"
          >
            <Skeleton className="mx-auto h-7 w-16" />
            <Skeleton className="mx-auto mt-1 h-3 w-14" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
