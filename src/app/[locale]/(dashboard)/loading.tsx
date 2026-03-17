import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid w-full grid-cols-3 items-start gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] border-s-4 border-s-[var(--border-strong)] bg-[var(--surface)]"
          >
            <div className="p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-12" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
      </div>

      <div className="h-fit w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="md:hidden">
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-4 border-b border-[var(--border)] px-4 py-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-4 items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-0"
            >
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
