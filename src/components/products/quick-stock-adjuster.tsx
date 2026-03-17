'use client';

import { StockAdjuster } from '@/components/stock-adjuster';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';

type VariantSummary = {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  stock_qty: number;
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
            type="button"
            onClick={() => setIsOpen(true)}
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

          <div className="absolute end-4 top-14 z-50 hidden w-[360px] md:block">
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
                      <StockAdjuster
                        variantId={variant.id}
                        shopId={shopId}
                        initialStock={variantStocks[variant.id] ?? variant.stock_qty}
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
                  <StockAdjuster
                    variantId={variant.id}
                    shopId={shopId}
                    initialStock={variantStocks[variant.id] ?? variant.stock_qty}
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
