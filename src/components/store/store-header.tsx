'use client';

import { CartDrawer } from '@/components/store/cart-drawer';
import { useCart } from '@/hooks/use-cart';
import { ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';

export function StoreHeader({
  slug,
  shopName,
  open,
  onOpenChange,
}: {
  slug: string;
  shopName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { itemCount } = useCart(slug);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = typeof open === 'boolean';
  const cartOpen = isControlled ? open : internalOpen;
  const badgeLabel = useMemo(() => (itemCount > 9 ? '9+' : String(itemCount)), [itemCount]);

  const setCartOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
        aria-label={`Open ${shopName} cart`}
      >
        <ShoppingCart size={18} />
        {itemCount > 0 ? (
          <span className="absolute end-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent-coral)] px-1 text-[10px] font-bold text-[var(--text-inverse)]">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      <CartDrawer slug={slug} open={cartOpen} onClose={() => setCartOpen(false)} shopName={shopName} />
    </>
  );
}
