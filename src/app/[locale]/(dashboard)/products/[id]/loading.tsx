import { Skeleton } from '@/components/ui/skeleton'

export default function EditProductLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page title */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Product Details card */}
      <div className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4">

        {/* Section label */}
        <Skeleton className="h-3 w-28" />

        {/* Name field */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        </div>

        {/* Description field */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full rounded-[var(--radius-md)]" />
        </div>

        {/* Price field */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>

      </div>

      {/* Variants card */}
      <div className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] p-5 space-y-4">

        {/* Section header + Add Variant button */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-28 rounded-[var(--radius-md)]" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[48px_1fr_90px_130px_36px] gap-3
          pb-2 border-b border-[var(--border)]">
          {['w-8','w-20','w-12','w-16','w-6'].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>

        {/* Variant rows — 3 rows */}
        {[1,2,3].map(i => (
          <div key={i}
            className="grid grid-cols-[48px_1fr_90px_130px_36px]
              gap-3 items-center py-2
              border-b border-[var(--border)] last:border-0">
            {/* Image */}
            <Skeleton className="w-10 h-10 rounded-[var(--radius-md)]" />
            {/* Variant name */}
            <Skeleton className="h-4 w-24" />
            {/* Stock adjuster */}
            <div className="flex items-center gap-1">
              <Skeleton className="w-7 h-7 rounded-[var(--radius-md)]" />
              <Skeleton className="w-8 h-7 rounded-[var(--radius-md)]" />
              <Skeleton className="w-7 h-7 rounded-[var(--radius-md)]" />
            </div>
            {/* Price override */}
            <Skeleton className="h-9 rounded-[var(--radius-md)]" />
            {/* Delete */}
            <Skeleton className="w-6 h-6 rounded" />
          </div>
        ))}

      </div>

      {/* Stock adjustment history card */}
      <div className="bg-[var(--surface)] border border-[var(--border)]
        rounded-[var(--radius-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3
          border-b border-[var(--border)]">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[1,2,3].map(i => (
          <div key={i}
            className="flex items-center justify-between px-4 py-3
              border-b border-[var(--border)] last:border-0 gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Save / Cancel buttons */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-11 w-20 rounded-[var(--radius-md)]" />
        <Skeleton className="h-11 w-28 rounded-[var(--radius-md)]" />
      </div>

    </div>
  )
}
