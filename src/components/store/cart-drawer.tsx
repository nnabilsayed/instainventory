'use client';

import { storageImage } from '@/lib/image';
import { useCart } from '@/hooks/use-cart';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';

function formatPrice(price: number) {
  return `${price.toFixed(2)} EGP`;
}

export function CartDrawer({
  slug,
  open,
  onClose,
  shopName,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
  shopName: string;
}) {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart(slug);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, open]);

  return (
    <div
      className={[
        'fixed inset-0 z-50 transition-opacity duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label={`Close ${shopName} cart`}
        onClick={onClose}
        className="absolute inset-0"
      >
        <span className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)]" />
      </button>

      <section
        aria-label={`${shopName} cart`}
        className={[
          'fixed bottom-0 inset-x-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-[var(--surface)] shadow-[var(--shadow-md)] transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-8 rounded-full bg-[var(--border)]" />
        </div>

        <div className="flex items-center justify-between border-b border-[var(--border)] ps-4 pe-2 py-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Your cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
              <ShoppingBag size={22} />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.variantId}
                    className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storageImage(item.imageUrl, { width: 96, height: 96, resize: 'cover' }) ?? item.imageUrl}
                        alt={item.productName}
                        className="h-12 w-12 rounded-[var(--radius-sm)] object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-[var(--radius-sm)] bg-[var(--surface-hover)]" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.productName}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.variantName}</p>
                          <p className="mt-1 text-sm text-[var(--text-primary)]">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:text-[var(--danger-text)]"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-1">
                        <button
                          type="button"
                          disabled={item.quantity === 1}
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-50"
                          aria-label={`Decrease quantity for ${item.productName}`}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-sm text-[var(--text-primary)]">
                            <Minus size={14} />
                          </span>
                        </button>

                        <span className="min-w-8 text-center text-sm text-[var(--text-primary)]">{item.quantity}</span>

                        <button
                          type="button"
                          disabled={item.quantity === item.maxQuantity}
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-50"
                          aria-label={`Increase quantity for ${item.productName}`}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-sm text-[var(--text-primary)]">
                            <Plus size={14} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
              <div className="flex items-center justify-between gap-4 text-sm text-[var(--text-primary)]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                <span className="text-[var(--text-primary)]">Shipping</span>
                <span className="text-[var(--text-secondary)]">Calculated at checkout</span>
              </div>
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = `/store/${slug}/buy`;
                  }}
                  className="min-h-[48px] w-full rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-4 py-3 text-sm font-medium text-[var(--text-inverse)] transition-colors hover:bg-[var(--accent-navy-hover)]"
                >
                  Checkout · {itemCount} item{itemCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
