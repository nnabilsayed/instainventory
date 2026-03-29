'use client';

import QuickStockAdjuster from '@/components/products/quick-stock-adjuster';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Check, GripVertical, Package, Pencil, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import DeleteProductButton from './delete-button';

type Category = {
  id: string;
  name: string;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  category_id: string | null;
  categories: { id: string; name: string } | null;
  product_variants: {
    id: string;
    name: string | null;
    size: string | null;
    color: string | null;
    stock_qty: number;
    image_url?: string | null;
    price?: number | null;
  }[];
};

export function ProductsClient({
  products,
  categories,
  shopId,
  locale,
}: {
  products: Product[];
  categories: Category[];
  shopId: string;
  locale: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'uncategorized') {
      return products.filter((product) => !product.category_id);
    }
    return products.filter((product) => product.category_id === activeCategory);
  }, [products, activeCategory]);

  function categoryCount(categoryId: string) {
    if (categoryId === 'all') return products.length;
    if (categoryId === 'uncategorized') return products.filter((product) => !product.category_id).length;
    return products.filter((product) => product.category_id === categoryId).length;
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setSaving(true);

    const { error } = await supabase.from('categories').insert({
      shop_id: shopId,
      name,
      sort_order: categories.length,
    });

    if (error) {
      if (error.code === '23505') {
        notify.error('A category with this name already exists');
      } else {
        notify.error('Failed to create category');
      }
    } else {
      notify.success(`Category "${name}" created`);
      setNewCategoryName('');
      router.refresh();
    }

    setSaving(false);
  }

  async function handleRenameCategory(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setSaving(true);

    const { error } = await supabase.from('categories').update({ name }).eq('id', id);

    if (error) {
      if (error.code === '23505') {
        notify.error('A category with this name already exists');
      } else {
        notify.error('Failed to rename category');
      }
    } else {
      notify.success('Category renamed');
      setEditingId(null);
      setEditingName('');
      router.refresh();
    }

    setSaving(false);
  }

  async function handleDeleteCategory(id: string, name: string) {
    const count = categoryCount(id);
    if (count > 0) {
      notify.error(`Move or uncategorize ${count} product${count > 1 ? 's' : ''} first`);
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      notify.error('Failed to delete category');
    } else {
      notify.success(`Category "${name}" deleted`);
      if (activeCategory === id) setActiveCategory('all');
      router.refresh();
    }
  }

  const uncategorizedProducts = products.filter((product) => !product.category_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">Products</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryManager((prev) => !prev)}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-medium transition-colors',
              showCategoryManager
                ? 'border-[var(--border-strong)] bg-[var(--surface-hover)] text-primary'
                : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
            )}
          >
            <GripVertical size={13} />
            Categories
          </button>

          <Link
            href={`/${locale}/products/new`}
            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)]"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        </div>
      </div>

      {showCategoryManager && (
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">Manage categories</p>
            <button
              type="button"
              onClick={() => setShowCategoryManager(false)}
              className="text-tertiary transition-colors hover:text-primary"
            >
              <X size={14} />
            </button>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 border-b border-[var(--border)] py-1.5 last:border-0"
                >
                  {editingId === category.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') void handleRenameCategory(category.id);
                          if (event.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        autoFocus
                        className="h-8 flex-1 rounded-[var(--radius-md)] border border-[var(--accent-navy)] bg-[var(--surface-hover)] px-2 text-sm text-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleRenameCategory(category.id)}
                        disabled={saving}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-white"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-primary">{category.name}</span>
                      <span className="text-xs text-tertiary">{categoryCount(category.id)} products</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                        }}
                        className="p-1 text-tertiary transition-colors hover:text-primary"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(category.id, category.name)}
                        className="p-1 text-tertiary transition-colors hover:text-[var(--danger-text)]"
                      >
                        <X size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreateCategory();
              }}
              placeholder="New category name..."
              maxLength={50}
              className="h-9 flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
            />
            <button
              type="button"
              onClick={() => void handleCreateCategory()}
              disabled={saving || !newCategoryName.trim()}
              className="flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-4 text-sm font-medium text-white transition-colors disabled:opacity-40"
            >
              <Plus size={13} />
              Add
            </button>
          </div>

          {categories.length === 0 && (
            <p className="py-2 text-center text-xs text-tertiary">No categories yet - add your first one above</p>
          )}
        </div>
      )}

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={cn(
            'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
            activeCategory === 'all'
              ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
              : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
          )}
        >
          All
          <span className="ms-1.5 text-xs opacity-60">{products.length}</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              activeCategory === category.id
                ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
            )}
          >
            {category.name}
            <span className="ms-1.5 text-xs opacity-60">{categoryCount(category.id)}</span>
          </button>
        ))}

        {uncategorizedProducts.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveCategory('uncategorized')}
            className={cn(
              'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              activeCategory === 'uncategorized'
                ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
            )}
          >
            Uncategorized
            <span className="ms-1.5 text-xs opacity-60">{categoryCount('uncategorized')}</span>
          </button>
        )}
      </div>

      {activeCategory === 'all' && categories.length > 0 ? (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category_id === category.id);
            if (categoryProducts.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-widest text-secondary">{category.name}</p>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-xs text-tertiary">{categoryProducts.length}</span>
                </div>

                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    categories={categories}
                    shopId={shopId}
                    onCategoryChange={() => router.refresh()}
                  />
                ))}
              </div>
            );
          })}

          {uncategorizedProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-widest text-tertiary">Uncategorized</p>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {uncategorizedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  categories={categories}
                  shopId={shopId}
                  onCategoryChange={() => router.refresh()}
                />
              ))}
            </div>
          )}

          {products.length === 0 && (
            <div className="space-y-3 py-16 text-center">
              <div className="text-4xl">[ ]</div>
              <p className="text-sm font-medium text-primary">No products yet</p>
              <p className="text-xs text-secondary">Add your first product to start building your catalog.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="space-y-3 py-16 text-center">
              <div className="text-4xl">{products.length === 0 ? '[ ]' : '#'}</div>
              <p className="text-sm font-medium text-primary">
                {products.length === 0 ? 'No products yet' : 'No products in this category'}
              </p>
              <p className="text-xs text-secondary">
                {products.length === 0
                  ? 'Add your first product to start building your catalog.'
                  : 'Assign products to this category from their edit page'}
              </p>
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                categories={categories}
                shopId={shopId}
                onCategoryChange={() => router.refresh()}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  locale,
  categories,
  shopId,
  onCategoryChange,
}: {
  product: Product;
  locale: string;
  categories: Category[];
  shopId: string;
  onCategoryChange: () => void;
}) {
  const supabase = createClient();
  const totalStock = product.product_variants.reduce((sum, variant) => sum + Math.max(0, variant.stock_qty), 0);

  async function handleCategoryChange(categoryId: string) {
    const { error } = await supabase
      .from('products')
      .update({
        category_id: categoryId === 'none' ? null : categoryId,
      })
      .eq('id', product.id);

    if (error) {
      notify.error('Failed to update category');
      return;
    }

    notify.success('Category updated');
    onCategoryChange();
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-hover)] text-secondary">
          <Package size={16} />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-primary">{product.name}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                product.is_active
                  ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                  : 'bg-[var(--neutral-bg)] text-[var(--neutral-text)]'
              )}
            >
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm font-semibold text-primary">{product.price} EGP</p>
          <div className="flex flex-wrap items-center gap-2">
            <QuickStockAdjuster
              shopId={shopId}
              productName={product.name}
              variants={product.product_variants.map((variant) => ({
                id: variant.id,
                name: variant.name ?? '',
                size: variant.size,
                color: variant.color,
                stock_qty: variant.stock_qty,
                image_url: variant.image_url ?? null,
                price: variant.price_override ?? product.price ?? null,
              }))}
            />
            <select
              value={product.category_id ?? 'none'}
              onChange={(event) => void handleCategoryChange(event.target.value)}
              className="cursor-pointer border-none bg-transparent text-xs text-secondary outline-none transition-colors hover:text-primary"
            >
              <option value="none">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-secondary">
              {product.product_variants.length} variant{product.product_variants.length !== 1 ? 's' : ''} - {totalStock} in stock
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Link
            href={`/${locale}/products/${product.id}`}
            className="flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-xs font-medium text-secondary transition-colors hover:bg-[var(--surface-hover)]"
          >
            Edit
          </Link>
          <DeleteProductButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
