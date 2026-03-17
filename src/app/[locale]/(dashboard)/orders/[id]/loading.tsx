import { Skeleton } from '@/components/ui/skeleton';

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Skeleton className="h-4 w-24" />

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-3 h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-28" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Skeleton className="h-6 w-12" />
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2 rounded-lg bg-[var(--surface-hover)] p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Skeleton className="h-6 w-32" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="mt-4 h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-28 rounded-lg" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="mt-4 h-11 w-64 rounded-lg" />
      </div>
    </div>
  );
}
