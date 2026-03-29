'use client';

import { useCart } from '@/hooks/use-cart';
import { storageImage } from '@/lib/image';
import { AlertCircle, CheckCircle2, MessageCircle, Package, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Shop = {
  name: string;
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
  image_url?: string | null;
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

function formatPrice(value: number | string) {
  return `${Number(value) || 0} EGP`;
}

function buildWhatsappLink(phone: string | null | undefined, message: string) {
  if (!phone) return null;
  const sanitizedPhone = String(phone).replace(/\D/g, '');
  if (!sanitizedPhone) return null;
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

function getVariantLabel(variant: ProductVariant | null) {
  if (!variant) return 'Default variant';

  if (variant.name?.trim()) {
    return variant.name;
  }

  const parts = [variant.size, variant.color].filter((value): value is string => Boolean(value?.trim()));
  return parts.join(' / ') || 'Default variant';
}

function optionState(
  variants: ProductVariant[],
  group: 'size' | 'color' | 'name',
  value: string,
  selectedSize: string | null,
  selectedColor: string | null,
  selectedName: string | null,
) {
  const matches = variants.filter((variant) => {
    if ((variant[group] ?? '') !== value) return false;
    if (group !== 'size' && selectedSize && variant.size !== selectedSize) return false;
    if (group !== 'color' && selectedColor && variant.color !== selectedColor) return false;
    if (group !== 'name' && selectedName && variant.name !== selectedName) return false;
    return true;
  });

  return {
    disabled: matches.length > 0 && matches.every((variant) => variant.stock_qty <= 0),
  };
}

export function ProductDetailClient({
  product,
  shop,
  slug,
  onOpenCart,
}: {
  product: Product;
  shop: Shop;
  slug: string;
  onOpenCart: () => void;
}) {
  const { addItem } = useCart(slug);
  const variants = useMemo(() => product.product_variants ?? [], [product.product_variants]);
  const hasSizes = variants.some((variant) => Boolean(variant.size));
  const hasColors = variants.some((variant) => Boolean(variant.color));
  const hasNamedOptions = variants.some((variant) => Boolean(variant.name) && !variant.size && !variant.color);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const selectVariant = (variant: ProductVariant) => {
    if (variant.stock_qty <= 0) {
      return;
    }

    setSelectedColor(variant.color ?? null);
    setSelectedName(variant.name ?? null);
    setSelectedVariant(variant);
  };

  const sizeOptions = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.size).filter((value): value is string => Boolean(value)))),
    [variants],
  );
  const colorOptions = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))),
    [variants],
  );
  const nameOptions = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.name).filter((value): value is string => Boolean(value)))),
    [variants],
  );

  useEffect(() => {
    if (variants && variants.length > 0) {
      const firstWithImage = variants.find((variant) => variant.image_url);
      const initialVariant = firstWithImage ?? variants[0];
      setSelectedVariant(initialVariant);

      if (hasColors) {
        setSelectedColor(initialVariant.color ?? null);
      }

      if (hasNamedOptions && !hasSizes && !hasColors) {
        setSelectedName(initialVariant.name ?? null);
      }
    }
  }, [hasColors, hasNamedOptions, hasSizes, variants]);

  const activeImage = useMemo(() => {
    if (selectedVariant?.image_url) {
      return selectedVariant.image_url;
    }

    const sorted = [...(product.product_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    return sorted[0]?.url ?? null;
  }, [selectedVariant, product.product_images]);

  const imageVariants = useMemo(
    () => variants.filter((variant) => Boolean(variant.image_url)),
    [variants],
  );

  const selectedPrice =
    selectedVariant?.price_override !== null && selectedVariant?.price_override !== undefined
      ? selectedVariant.price_override
      : product.price;

  const hasVariants = variants.length > 0;
  const needsSelection =
    (hasSizes && !selectedSize) ||
    (hasColors && !selectedColor) ||
    (hasNamedOptions && !hasSizes && !hasColors && !selectedName);
  const selectedOutOfStock = selectedVariant ? selectedVariant.stock_qty <= 0 : false;
  const whatsappUrl = buildWhatsappLink(shop.whatsapp, `Hi! I have a question about ${product.name} from ${shop.name}`);

  let buttonLabel = 'Add to cart';
  let buttonDisabled = false;
  let buttonClassName = 'bg-[var(--accent-navy)] text-[var(--text-inverse)] hover:bg-[var(--accent-navy-hover)]';

  if (needsSelection) {
    buttonLabel = 'Select a variant';
    buttonDisabled = true;
    buttonClassName = 'bg-[var(--surface-hover)] text-[var(--text-tertiary)]';
  } else if (selectedOutOfStock) {
    buttonLabel = 'Out of stock';
    buttonDisabled = true;
    buttonClassName = 'bg-[var(--surface-hover)] text-[var(--text-tertiary)]';
  }

  return (
    <div>
      <div className="mx-4 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-hover)]">
        <div className="relative aspect-square">
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storageImage(activeImage, { width: 960, height: 960, resize: 'cover' }) ?? activeImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--border-strong)]">
              <Package size={48} />
            </div>
          )}
        </div>
      </div>

      {imageVariants.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {imageVariants.map((variant) => {
            const selected = selectedVariant?.id === variant.id;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => selectVariant(variant)}
                disabled={variant.stock_qty <= 0}
                className={
                  selected
                    ? 'h-16 w-16 min-h-[44px] shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 border-[var(--accent-navy)]'
                    : 'h-16 w-16 min-h-[44px] shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 border-[var(--border)] transition-colors hover:border-[var(--border-strong)]'
                }
                aria-label={`Select ${getVariantLabel(variant)}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storageImage(variant.image_url ?? '', { width: 112, height: 112, resize: 'cover' }) ?? variant.image_url ?? ''}
                  alt={getVariantLabel(variant)}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="px-4 py-4">
        <section>
          <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">{product.name}</h1>
          <p className="mb-1.5 text-lg font-semibold text-[var(--accent-navy)]">{formatPrice(selectedPrice)}</p>
          {product.description?.trim() ? (
            <p className="mb-4 text-sm text-[var(--text-secondary)]">{product.description}</p>
          ) : null}
        </section>

        {hasVariants ? (
          <section>
            {hasSizes ? (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--text-secondary)]">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    const { disabled } = optionState(variants, 'size', size, selectedSize, selectedColor, selectedName);
                    const selected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (disabled) return;

                          setSelectedSize(size);

                          const matchingVariant =
                            variants.find(
                              (variant) =>
                                variant.size === size &&
                                (selectedColor ? variant.color === selectedColor : true),
                            ) ?? variants.find((variant) => variant.size === size) ?? null;

                          if (matchingVariant) {
                            setSelectedVariant(matchingVariant);
                          }
                        }}
                        disabled={disabled}
                        className={[
                          'min-h-[44px] rounded-[var(--radius-md)] px-5 py-2 text-[13px] transition-all',
                          selected
                            ? 'border-2 border-[var(--accent-navy)] bg-[var(--accent-navy)] font-medium text-[var(--text-inverse)]'
                            : 'bg-[var(--surface)] text-[var(--text-primary)]',
                          selected ? '' : 'border-[1.5px] border-[var(--border)] hover:border-[var(--border-strong)]',
                          disabled
                            ? 'cursor-not-allowed border-[1.5px] border-[var(--border)] text-[var(--text-tertiary)] opacity-50 line-through hover:border-[var(--border)]'
                            : '',
                        ].join(' ')}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {hasColors ? (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--text-secondary)]">
                  Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const { disabled } = optionState(variants, 'color', color, selectedSize, selectedColor, selectedName);
                    const selected = selectedColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          if (disabled) return;

                          setSelectedColor(color);

                          const matchingVariant =
                            variants.find(
                              (variant) =>
                                variant.color === color &&
                                (selectedSize ? variant.size === selectedSize : true),
                            ) ?? variants.find((variant) => variant.color === color) ?? null;

                          if (matchingVariant) {
                            setSelectedVariant(matchingVariant);
                          }
                        }}
                        disabled={disabled}
                        className={[
                          'min-h-[44px] rounded-[var(--radius-md)] px-5 py-2 text-[13px] transition-all',
                          selected
                            ? 'border-2 border-[var(--accent-navy)] bg-[var(--accent-navy)] font-medium text-[var(--text-inverse)]'
                            : 'bg-[var(--surface)] text-[var(--text-primary)]',
                          selected ? '' : 'border-[1.5px] border-[var(--border)] hover:border-[var(--border-strong)]',
                          disabled
                            ? 'cursor-not-allowed border-[1.5px] border-[var(--border)] text-[var(--text-tertiary)] opacity-50 line-through hover:border-[var(--border)]'
                            : '',
                        ].join(' ')}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {hasNamedOptions ? (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--text-secondary)]">
                  Option
                </p>
                <div className="flex flex-wrap gap-2">
                  {nameOptions.map((name) => {
                    const variant = variants.find((item) => item.name === name) ?? null;
                    const disabled = variant ? variant.stock_qty <= 0 : false;
                    const selected = selectedName === name;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          if (!variant || disabled) return;
                          selectVariant(variant);
                        }}
                        disabled={disabled}
                        className={[
                          'min-h-[44px] rounded-[var(--radius-md)] px-5 py-2 text-[13px] transition-all',
                          selected
                            ? 'border-2 border-[var(--accent-navy)] bg-[var(--accent-navy)] font-medium text-[var(--text-inverse)]'
                            : 'bg-[var(--surface)] text-[var(--text-primary)]',
                          selected ? '' : 'border-[1.5px] border-[var(--border)] hover:border-[var(--border-strong)]',
                          disabled
                            ? 'cursor-not-allowed border-[1.5px] border-[var(--border)] text-[var(--text-tertiary)] opacity-50 line-through hover:border-[var(--border)]'
                            : '',
                        ].join(' ')}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {selectedVariant ? (
              selectedVariant.stock_qty > 3 ? (
                <div className="mb-4 flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--success-bg)] px-3 py-2 text-sm font-medium text-[var(--success-text)]">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>In stock - {selectedVariant.stock_qty} available</span>
                </div>
              ) : selectedVariant.stock_qty > 0 ? (
                <div className="mb-4 flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--warning-bg)] px-3 py-2 text-sm font-medium text-[var(--warning-text)]">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Only {selectedVariant.stock_qty} left</span>
                </div>
              ) : (
                <div className="mb-4 flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--danger-bg)] px-3 py-2 text-sm font-medium text-[var(--danger-text)]">
                  <XCircle size={14} className="shrink-0" />
                  <span>Out of stock</span>
                </div>
              )
            ) : null}
          </section>
        ) : null}
      </div>

      <div className="mt-4 mb-6 px-4">
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => {
            if (!selectedVariant) {
              return;
            }

            addItem({
              variantId: selectedVariant.id,
              productId: product.id,
              productName: product.name,
              variantName: getVariantLabel(selectedVariant),
              price:
                selectedVariant.price_override !== null && selectedVariant.price_override !== undefined
                  ? Number(selectedVariant.price_override)
                  : Number(product.price),
              maxQuantity: selectedVariant.stock_qty,
              imageUrl: selectedVariant.image_url ?? activeImage,
            });
            onOpenCart();
          }}
          className={`min-h-[52px] w-full rounded-[var(--radius-md)] text-sm font-medium transition-all disabled:cursor-not-allowed ${buttonClassName}`}
        >
          {buttonLabel}
        </button>

        {whatsappUrl ? (
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-[44px] items-center justify-center gap-1 text-center text-xs text-[var(--text-secondary)]"
          >
            <MessageCircle size={14} />
            <span>Have questions? Chat with us on WhatsApp</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
