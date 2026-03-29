'use client';

import { CartDrawer } from '@/components/store/cart-drawer';
import { useCart } from '@/hooks/use-cart';
import { ProductDetailClient } from '@/components/store/product-detail-client';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Shop = {
  name: string;
  slug: string;
  whatsapp: string | null;
};

type ProductImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

type ProductVariant = {
  id: string;
  name: string | null;
  size: string | null;
  color: string | null;
  image_url: string | null;
  stock_qty: number;
  price_override: number | string | null;
  low_stock_threshold: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
};

export function StoreProductPageClient({
  shop,
  product,
}: {
  shop: Shop;
  product: Product;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart(shop.slug);
  const badgeLabel = useMemo(() => (itemCount > 9 ? '9+' : String(itemCount)), [itemCount]);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={`/store/${shop.slug}`}
          className="flex min-h-[44px] items-center gap-1 text-sm text-[var(--text-secondary)]"
        >
          <ChevronLeft size={16} />
          <span>Back to store</span>
        </Link>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
          aria-label={`Open ${shop.name} cart`}
        >
          <ShoppingCart size={18} />
          {itemCount > 0 ? (
            <span className="absolute end-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent-coral)] px-1 text-[10px] font-bold text-[var(--text-inverse)]">
              {badgeLabel}
            </span>
          ) : null}
        </button>
      </div>

      <ProductDetailClient product={product} shop={shop} slug={shop.slug} onOpenCart={() => setCartOpen(true)} />

      <CartDrawer slug={shop.slug} open={cartOpen} onClose={() => setCartOpen(false)} shopName={shop.name} />
    </>
  );
}
