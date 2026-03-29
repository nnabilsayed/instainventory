'use client';

import { StockAdjuster } from '@/components/stock-adjuster';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

type VariantSummary = {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  stock_qty: number;
  image_url?: string | null;
  price?: number | null;
};

export default function QuickStockAdjuster({
  shopId,
  productName,
  variants,
}: {
  shopId: string;
  productName: string;
  variants: VariantSummary[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>(
    Object.fromEntries(variants.map((variant) => [variant.id, Number(variant.stock_qty) || 0]))
  );

  const totalStock = useMemo(
    () => Object.values(variantStocks).reduce((sum, value) => sum + value, 0),
    [variantStocks]
  );

  return (
    <>
      <div className="mt-1 flex items-center gap-2 text-xs text-secondary">
        {variants.length > 0 ? (
          <button
            ref={btnRef}
            type="button"
            onClick={() => {
              if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                setPanelPos({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
              }
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-1 py-0.5 text-xs text-secondary transition-colors hover:bg-[var(--surface-hover)] hover:text-primary"
            aria-label={`Adjust stock for ${productName}`}
          >
            <span>{totalStock} in stock</span>
            <Pencil size={13} />
          </button>
        ) : (
          <span>{totalStock} in stock</span>
        )}
      </div>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setIsOpen(false)} />

          <div
            style={{
              position: 'fixed',
              top: `${panelPos.top}px`,
              right: `${panelPos.right}px`,
              zIndex: 50,
              width: '360px',
            }}
            className="hidden md:block"
          >
            <Card className="border border-[var(--border)] shadow-xl">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">Quick stock update</p>
                    <p className="text-xs text-secondary">{productName}</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                      <div className="mb-3 flex items-center gap-2 border-b border-[var(--border)] pb-3">
                        {variant.image_url ? (
                          <img
                            src={variant.image_url}
                            alt={variant.name}
                            className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-hover)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {[variant.size, variant.color].filter(Boolean).join(' / ') ||
                              variant.name ||
                              'Variant'}
                          </div>
                          {variant.price != null && (
                            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                              {Number(variant.price).toLocaleString('en-EG')} EGP
                            </div>
                          )}
                        </div>
                      </div>
                      <StockAdjuster
                        variantId={variant.id}
                        shopId={shopId}
                        initialStock={variantStocks[variant.id] ?? variant.stock_qty}
                        imageUrl={variant.image_url ?? null}
                        price={variant.price ?? null}
                        variantLabel={
                          [variant.size, variant.color].filter(Boolean).join(' / ') ||
                          variant.name ||
                          `Variant ${index + 1}`
                        }
                        compact
                        onStockChange={(nextStock) =>
                          setVariantStocks((current) => ({ ...current, [variant.id]: nextStock }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl md:hidden">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border)]" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Quick stock update</p>
                <p className="text-xs text-secondary">{productName}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pb-2">
              {variants.map((variant, index) => (
                <div key={variant.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                  <div className="mb-3 flex items-center gap-2 border-b border-[var(--border)] pb-3">
                    {variant.image_url ? (
                      <img
                        src={variant.image_url}
                        alt={variant.name}
                        className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-hover)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {[variant.size, variant.color].filter(Boolean).join(' / ') ||
                          variant.name ||
                          'Variant'}
                      </div>
                      {variant.price != null && (
                        <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {Number(variant.price).toLocaleString('en-EG')} EGP
                        </div>
                      )}
                    </div>
                  </div>
                  <StockAdjuster
                    variantId={variant.id}
                    shopId={shopId}
                    initialStock={variantStocks[variant.id] ?? variant.stock_qty}
                    imageUrl={variant.image_url ?? null}
                    price={variant.price ?? null}
                    variantLabel={
                      [variant.size, variant.color].filter(Boolean).join(' / ') ||
                      variant.name ||
                      `Variant ${index + 1}`
                    }
                    compact
                    onStockChange={(nextStock) =>
                      setVariantStocks((current) => ({ ...current, [variant.id]: nextStock }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
