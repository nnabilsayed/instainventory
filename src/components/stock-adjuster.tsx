'use client';

import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface StockAdjusterProps {
  variantId: string;
  shopId: string;
  initialStock: number;
  imageUrl?: string | null;
  price?: number | null;
  variantLabel: string;
  onStockChange?: (newStock: number) => void;
  compact?: boolean;
}

export function StockAdjuster({
  variantId,
  shopId,
  initialStock,
  imageUrl,
  price,
  variantLabel,
  onStockChange,
  compact = false,
}: StockAdjusterProps) {
  void imageUrl;
  void price;
  const router = useRouter();
  const [stock, setStock] = useState(initialStock);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('');
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimeout = () => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  useEffect(() => {
    return () => {
      clearRefreshTimeout();
    };
  }, []);

  const clearFlashSoon = (
    nextFlash: 'success' | 'error',
    options?: { refresh?: boolean }
  ) => {
    setFlash(nextFlash);
    clearRefreshTimeout();

    flashTimeoutRef.current = setTimeout(() => {
      setFlash(null);
      if (nextFlash === 'success' && options?.refresh) {
        router.refresh();
      }
    }, 1000);
  };

  async function adjust(amount: number, reasonText?: string) {
    if (amount === 0 || loading) return;

    if (variantId.startsWith('new-')) {
      const nextStock = Math.max(0, stock + amount);
      setStock(nextStock);
      onStockChange?.(nextStock);
      clearFlashSoon('success');
      notify.stockUpdated();
      setCustomAmount('');
      setReason('');
      setShowCustom(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/variants/${variantId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: amount,
          reason: reasonText || null,
          shop_id: shopId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        clearFlashSoon('error');
        notify.error(data.error || 'Failed to update stock');
        return;
      }

      setStock(data.stock_qty);
      onStockChange?.(data.stock_qty);
      clearFlashSoon('success', { refresh: true });
      notify.stockUpdated();
      setCustomAmount('');
      setReason('');
      setShowCustom(false);
    } catch {
      clearFlashSoon('error');
      notify.stockError();
    } finally {
      setLoading(false);
    }
  }

  function handleCustomApply() {
    const num = parseInt(customAmount, 10);

    if (Number.isNaN(num) || num === 0) {
      notify.error('Enter a valid number (for example +10 or -3)');
      return;
    }

    void adjust(num, reason);
  }

  const isLow = stock <= 3 && stock > 0;
  const isOut = stock === 0;

  return (
    <div className="relative space-y-1">
      <div className={cn('flex items-center gap-2', compact && 'flex-wrap')}>
        <button
          type="button"
          onClick={() => void adjust(-1)}
          disabled={loading || stock <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-secondary transition-colors active:scale-95 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Decrease stock for ${variantLabel}`}
        >
          <Minus size={14} />
        </button>

        <div
          className={cn(
            'flex h-9 min-w-[60px] flex-1 items-center justify-center rounded-[var(--radius-md)] border text-sm font-semibold transition-colors duration-300',
            flash === 'success'
              ? 'border-[var(--success-text)] bg-[var(--success-bg)] text-[var(--success-text)]'
              : flash === 'error'
                ? 'border-[var(--danger-text)] bg-[var(--danger-bg)] text-[var(--danger-text)]'
                : isOut
                  ? 'border-[var(--danger-text)]/30 bg-[var(--danger-bg)] text-[var(--danger-text)]'
                  : isLow
                    ? 'border-[var(--warning-text)]/30 bg-[var(--warning-bg)] text-[var(--warning-text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-primary',
            compact && 'min-w-[52px] flex-none px-3'
          )}
        >
          {flash === 'success' ? (
            <Check size={14} />
          ) : flash === 'error' ? (
            <X size={14} />
          ) : (
            <span>{stock}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void adjust(1)}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-secondary transition-colors active:scale-95 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Increase stock for ${variantLabel}`}
        >
          <Plus size={14} />
        </button>

        <button
          type="button"
          onClick={() => setShowCustom((prev) => !prev)}
          className="flex h-9 items-center gap-1 whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-xs text-secondary transition-colors hover:bg-[var(--surface-hover)]"
        >
          Custom
          {showCustom ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {(isOut || isLow) && (
        <p
          className={cn(
            'text-xs font-medium',
            isOut ? 'text-[var(--danger-text)]' : 'text-[var(--warning-text)]'
          )}
        >
          {isOut ? 'Out of stock' : `Low stock, only ${stock} left`}
        </p>
      )}

      {showCustom && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowCustom(false);
              setCustomAmount('');
              setReason('');
            }}
          />

          <div className="absolute start-0 top-full z-20 mt-1 w-[280px] space-y-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-md)]">
            <p className="text-xs font-medium text-secondary">
              Adjust stock for {variantLabel}
            </p>

            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="+10 or -3"
              autoFocus
              className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
            />

            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              maxLength={200}
              className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
            />

            <div className="flex flex-wrap gap-1.5">
              {['New shipment', 'Damaged', 'Stock count', 'Sample'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-xs transition-colors',
                    reason === preset
                      ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                      : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleCustomApply}
                disabled={loading || !customAmount}
                className="flex h-8 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-xs font-medium text-white transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Apply'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustom(false);
                  setCustomAmount('');
                  setReason('');
                }}
                className="h-8 rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-xs text-secondary transition-colors hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
