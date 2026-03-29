'use client';

import { Package, Search, SearchX, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type CatalogueProduct = {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  category: { id: string; name: string } | null;
  imageUrl: string | null;
  isOutOfStock: boolean;
};

type CatalogueClientProps = {
  products: CatalogueProduct[];
  slug: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function CatalogueClient({ products, slug }: CatalogueClientProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      if (product.category?.id && product.category?.name) {
        map.set(product.category.id, product.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.category_id) {
        counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
      }
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        search === '' || product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === null || product.category_id === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  return (
    <div>
      <div className="relative mb-3">
        <Search
          size={16}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] pe-3 ps-[38px] text-[13px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)]"
        />
        {search !== '' ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute end-[10px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)]"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={
              activeCategory === null
                ? 'shrink-0 rounded-full border-[1.5px] border-[var(--accent-navy)] bg-[var(--accent-navy)] px-[14px] py-1.5 text-xs font-medium text-[var(--text-inverse)] transition-all duration-150'
                : 'shrink-0 rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-[14px] py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)]'
            }
          >
            All {products.length}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={
                activeCategory === category.id
                  ? 'shrink-0 rounded-full border-[1.5px] border-[var(--accent-navy)] bg-[var(--accent-navy)] px-[14px] py-1.5 text-xs font-medium text-[var(--text-inverse)] transition-all duration-150'
                  : 'shrink-0 rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-[14px] py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)]'
              }
            >
              {category.name} {countsByCategory.get(category.id) ?? 0}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          {search !== '' ? (
            <>
              <SearchX size={32} className="mx-auto text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No products match &quot;{search}&quot;
              </p>
            </>
          ) : (
            <>
              <Package size={32} className="mx-auto text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No products in this category
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <a
              key={product.id}
              href={`/store/${slug}/product/${product.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="relative block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)]">
                {product.isOutOfStock ? (
                  <span className="absolute start-2 top-2 z-[1] rounded-[10px] bg-[var(--neutral-bg)] px-[7px] py-[2px] text-[10px] font-medium text-[var(--neutral-text)]">
                    Out of stock
                  </span>
                ) : null}

                <div
                  style={{
                    width: '100%',
                    paddingTop: '100%',
                    position: 'relative',
                    background: 'var(--background)',
                    overflow: 'hidden',
                  }}
                >
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: product.isOutOfStock ? 0.5 : 1,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: product.isOutOfStock ? 0.5 : 1,
                      }}
                    >
                      <Package size={32} className="text-[var(--border-strong)]" />
                    </div>
                  )}
                </div>

                <div className="p-[10px]">
                  <p
                    className={
                      product.isOutOfStock
                        ? 'mb-0.5 truncate text-[13px] font-medium text-[var(--text-tertiary)]'
                        : 'mb-0.5 truncate text-[13px] font-medium text-[var(--text-primary)]'
                    }
                  >
                    {product.name}
                  </p>
                  <p
                    className={
                      product.isOutOfStock
                        ? 'text-xs text-[var(--text-tertiary)]'
                        : 'text-xs text-[var(--text-secondary)]'
                    }
                  >
                    {formatPrice(product.price)} EGP
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
