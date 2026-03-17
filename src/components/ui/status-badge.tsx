import { cn } from '@/lib/utils'

type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type { OrderStatus }

const config: Record<OrderStatus, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: 'bg-[var(--neutral-bg)]', text: 'text-[var(--neutral-text)]', dot: 'bg-[var(--text-tertiary)]', label: 'Draft' },
  pending: { bg: 'bg-[var(--warning-bg)]', text: 'text-[var(--warning-text)]', dot: 'bg-[var(--warning-text)]', label: 'Pending' },
  confirmed: { bg: 'bg-[var(--info-bg)]', text: 'text-[var(--info-text)]', dot: 'bg-[var(--info-text)]', label: 'Confirmed' },
  shipped: { bg: 'bg-[var(--purple-bg)]', text: 'text-[var(--purple-text)]', dot: 'bg-[var(--purple-text)]', label: 'Shipped' },
  delivered: { bg: 'bg-[var(--success-bg)]', text: 'text-[var(--success-text)]', dot: 'bg-[var(--success-text)]', label: 'Delivered' },
  cancelled: { bg: 'bg-[var(--danger-bg)]', text: 'text-[var(--danger-text)]', dot: 'bg-[var(--danger-text)]', label: 'Cancelled' },
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const c = config[status]

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', c.bg, c.text, className)}>
      <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}
