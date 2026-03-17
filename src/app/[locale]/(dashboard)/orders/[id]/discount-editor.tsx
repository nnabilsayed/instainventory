'use client';

import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DiscountEditorProps {
  orderId: string;
  currentType: 'fixed' | 'percentage' | null;
  currentValue: number;
  currentAmount: number;
  subtotal: number;
}

export default function DiscountEditor({
  orderId,
  currentType,
  currentValue,
  currentAmount,
  subtotal,
}: DiscountEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'fixed' | 'percentage' | null>(currentType);
  const [value, setValue] = useState(currentType ? String(currentValue) : '');
  const [loading, setLoading] = useState(false);

  const previewAmount = (() => {
    if (!type || !value) return 0;
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed <= 0) return 0;
    if (type === 'fixed') return Math.min(parsed, subtotal);
    return Math.round((subtotal * Math.min(parsed, 100) / 100) * 100) / 100;
  })();

  async function saveDiscount() {
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({
        discount_type: type,
        discount_value: type ? parseFloat(value) || 0 : 0,
      })
      .eq('id', orderId)
      .eq('status', 'draft');

    if (error) {
      notify.orderError();
      setLoading(false);
      return;
    }

    notify.success('Discount updated');
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
      >
        <div>
          <p className="text-sm font-medium text-primary">Edit discount</p>
          <p className="text-xs text-secondary">
            {currentAmount > 0
              ? `Current discount: ${currentAmount.toFixed(2)} EGP`
              : 'No discount applied'}
          </p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-secondary" />
        ) : (
          <ChevronDown size={16} className="text-secondary" />
        )}
      </button>

      {open ? (
        <div className="space-y-2 border-t border-[var(--border)] p-4">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setType('fixed')}
              className={cn(
                'h-8 rounded-[var(--radius-md)] border text-xs font-medium transition-colors',
                type === 'fixed'
                  ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                  : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
              )}
            >
              Fixed (EGP)
            </button>
            <button
              type="button"
              onClick={() => setType('percentage')}
              className={cn(
                'h-8 rounded-[var(--radius-md)] border text-xs font-medium transition-colors',
                type === 'percentage'
                  ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                  : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
              )}
            >
              Percentage (%)
            </button>
          </div>

          {type ? (
            <div className="relative">
              <input
                type="number"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={type === 'fixed' ? '50' : '10'}
                min="0"
                max={type === 'percentage' ? '100' : undefined}
                className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] ps-3 pe-12 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-tertiary">
                {type === 'fixed' ? 'EGP' : '%'}
              </span>
            </div>
          ) : null}

          {previewAmount > 0 ? (
            <p className="text-xs font-medium text-[var(--success-text)]">
              Customer saves {previewAmount.toFixed(2)} EGP
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={saveDiscount}
              disabled={loading}
              className="flex h-9 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save discount'}
            </button>
            <button
              type="button"
              onClick={() => {
                setType(null);
                setValue('');
              }}
              disabled={loading}
              className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-sm text-[var(--danger-text)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
