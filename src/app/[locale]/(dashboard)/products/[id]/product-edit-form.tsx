'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySelect } from '@/components/category-select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StockAdjuster } from '@/components/stock-adjuster';
import { createClient } from '@/lib/supabase/client';
import { storageImage } from '@/lib/image';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { productSchema, variantSchema } from '@/lib/validations';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from 'lucide-react';

type VariantRow = {
  id: string;
  size: string;
  color: string;
  isManual: boolean;
  stock_qty: number | string;
  price_override: string;
  imageFile: File | null;
  imagePreview: string | null;
  image_url: string | null;
};

type Product = any;

type StockAdjustment = {
  id: string;
  adjustment: number;
  reason: string | null;
  stock_before: number;
  stock_after: number;
  created_at: string;
  variant_id: string;
  product_variants: {
    id: string;
    name: string;
    size: string | null;
    color: string | null;
  };
};

interface ProductEditFormProps {
  product: Product;
  shopId: string;
  adjustments: StockAdjustment[];
  categories: { id: string; name: string }[];
}

const PREVIEW_COUNT = 3;

const parseTags = (input: string) => input.split(',').map((s) => s.trim()).filter(Boolean);

const buildVariantName = (size: string, color: string) =>
  `${size || ''}${size && color ? ' / ' : ''}${color || ''}`.trim() || 'Default';

const createVariantRow = (size = '', color = '', isManual = false): VariantRow => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  size,
  color,
  isManual,
  stock_qty: 0,
  price_override: '',
  imageFile: null,
  imagePreview: null,
  image_url: null,
});

const generateVariantRows = (sizes: string[], colors: string[]) => {
  if (sizes.length > 0 && colors.length > 0) {
    return sizes.flatMap((size) => colors.map((color) => createVariantRow(size, color)));
  }
  if (sizes.length > 0) {
    return sizes.map((size) => createVariantRow(size, ''));
  }
  if (colors.length > 0) {
    return colors.map((color) => createVariantRow('', color));
  }
  return [];
};

const normalizeVariant = (variant: any): VariantRow => ({
  id: String(variant.id),
  size: variant.size || '',
  color: variant.color || '',
  isManual: false,
  stock_qty: variant.stock_qty || 0,
  price_override: variant.price_override?.toString() || '',
  imageFile: null,
  imagePreview: variant.image_url || null,
  image_url: variant.image_url || null,
});

export default function ProductEditForm({
  product,
  shopId,
  adjustments,
  categories,
}: ProductEditFormProps) {
  const t = useTranslations('products');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [name, setName] = useState(product.name || '');
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(product.price?.toString() || '0');
  const [categoryId, setCategoryId] = useState<string | null>(product.category_id || null);
  const [localCategories, setLocalCategories] = useState(categories);
  const [isActive, setIsActive] = useState(product.is_active);
  const [variants, setVariants] = useState<VariantRow[]>(
    product.product_variants && product.product_variants.length > 0
      ? product.product_variants.map(normalizeVariant)
      : []
  );
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const variantCountLabel = useMemo(() => `${variants.length} variants`, [variants.length]);
  const visibleAdjustments = historyExpanded
    ? adjustments
    : adjustments.slice(0, PREVIEW_COUNT);

  const handleVariantChange = (index: number, field: keyof VariantRow, value: string) => {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [`variant_${index}_${field}`]: '',
      [`variant_${index}_size`]: field === 'color' ? currentErrors[`variant_${index}_size`] : '',
      [`variant_${index}_color`]: field === 'size' ? currentErrors[`variant_${index}_color`] : '',
    }));
    setVariants((currentVariants) =>
      currentVariants.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((currentVariants) => [...currentVariants, createVariantRow('', '', true)]);
  };

  const removeVariant = (variantId: string) => {
    const index = variants.findIndex((variant) => variant.id === variantId);
    if (index < 0) return;

    const preview = variants[index]?.imagePreview;
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setVariants((currentVariants) => currentVariants.filter((variant) => variant.id !== variantId));
  };

  const resetVariants = () => {
    variants.forEach((variant) => {
      if (variant.imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(variant.imagePreview);
      }
    });
    setVariants([]);
    setSizeInput('');
    setColorInput('');
  };

  const generateVariants = () => {
    const sizes = parseTags(sizeInput);
    const colors = parseTags(colorInput);
    setVariants(generateVariantRows(sizes, colors));
  };

  const handleVariantImage = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setVariants((currentVariants) =>
      currentVariants.map((variant, itemIndex) => {
        if (itemIndex !== index) return variant;
        if (variant.imagePreview?.startsWith('blob:')) {
          URL.revokeObjectURL(variant.imagePreview);
        }
        return {
          ...variant,
          imageFile: file,
          imagePreview: URL.createObjectURL(file),
        };
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    const productResult = productSchema.safeParse({
      name,
      description,
      price,
      is_active: isActive,
    });

    if (!productResult.success) {
      const fieldErrors: Record<string, string> = {};
      productResult.error.errors.forEach((issue) => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const variantErrors: Record<string, string> = {};
    variants.forEach((variant, index) => {
      const result = variantSchema.safeParse({
        size: variant.size || undefined,
        color: variant.color || undefined,
        stock_qty: variant.stock_qty,
        price_override: variant.price_override === '' ? null : variant.price_override,
      });

      if (!result.success) {
        result.error.errors.forEach((issue) => {
          const key = issue.path[0] ? `variant_${index}_${String(issue.path[0])}` : `variant_${index}_general`;
          variantErrors[key] = issue.message;
        });
      }
    });

    if (Object.keys(variantErrors).length > 0) {
      setErrors(variantErrors);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: productError } = await supabase
      .from('products')
      .update({
        name,
        description,
        price: parseFloat(price),
        category_id: categoryId,
        is_active: isActive,
      })
      .eq('id', product.id);

    if (productError) {
      setError(productError.message);
      notify.productError();
      setLoading(false);
      return;
    }

    const preparedVariants = [];

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      let imageUrl = variant.image_url;

      if (variant.imageFile) {
        const ext = variant.imageFile.name.split('.').pop();
        const path = `${product.shop_id}/${product.id}/variant-${variant.id}-${index}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, variant.imageFile, {
          upsert: true,
        });

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`);
          notify.productError();
          setLoading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(path);
        imageUrl = publicUrl;
      }

      preparedVariants.push({
        ...variant,
        image_url: imageUrl,
      });
    }

    const newVariantIds = preparedVariants.filter((variant) => variant.id.startsWith('new-')).map((variant) => variant.id);
    const toUpdate = preparedVariants.filter((variant) => !variant.id.startsWith('new-')).map((variant) => {
      const { imageFile, imagePreview, isManual, ...rest } = variant;
      void imageFile;
      void imagePreview;
      void isManual;
      return {
        ...rest,
        name: buildVariantName(variant.size, variant.color),
        stock_qty: parseInt(variant.stock_qty.toString(), 10) || 0,
        price_override: variant.price_override ? parseFloat(variant.price_override) : null,
      };
    });

    const toInsert = preparedVariants.filter((variant) => variant.id.startsWith('new-')).map((variant) => {
      const { id, imageFile, imagePreview, isManual, ...rest } = variant;
      void id;
      void imageFile;
      void imagePreview;
      void isManual;
      return {
        ...rest,
        product_id: product.id,
        name: buildVariantName(variant.size, variant.color),
        stock_qty: parseInt(variant.stock_qty.toString(), 10) || 0,
        price_override: variant.price_override ? parseFloat(variant.price_override) : null,
      };
    });

    let updatedVariants: any[] = [];
    let insertedVariants: any[] = [];

    if (toUpdate.length > 0) {
      const results: any[] = [];
      for (const variant of toUpdate) {
        const { id, product_id, ...fields } = variant;
        void product_id;
        const { data, error: updateError } = await supabase
          .from('product_variants')
          .update(fields)
          .eq('id', id)
          .select('*')
          .single();
        if (updateError) {
          setError(updateError.message);
          notify.productError();
          setLoading(false);
          return;
        }
        if (data) results.push(data);
      }
      updatedVariants = results;
    }

    if (toInsert.length > 0) {
      const { data, error: insertError } = await supabase.from('product_variants').insert(toInsert).select('*');
      if (insertError) {
        setError(insertError.message);
        notify.productError();
        setLoading(false);
        return;
      }

      insertedVariants = data ?? [];
    }

    if (updatedVariants.length > 0 || insertedVariants.length > 0) {
      const updatedVariantMap = new Map(
        updatedVariants.map((variant) => [String(variant.id), normalizeVariant(variant)])
      );
      const insertedVariantRows = insertedVariants.map(normalizeVariant);
      const newVariantIdSet = new Set(newVariantIds);
      let insertedIndex = 0;

      setVariants((currentVariants) =>
        currentVariants.flatMap((variant) => {
          const updatedVariant = updatedVariantMap.get(variant.id);

          if (updatedVariant) {
            return [updatedVariant];
          }

          if (newVariantIdSet.has(variant.id)) {
            const insertedVariant = insertedVariantRows[insertedIndex];
            insertedIndex += 1;
            return insertedVariant ? [insertedVariant] : [variant];
          }

          return [variant];
        })
      );
    }

    setLoading(false);
    notify.productUpdated();
    router.push(`/${locale}/products`);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-tertiary">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('name')}</Label>
            <Input
              error={!!errors.name}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, name: '' }));
              }}
            />
            <FieldError message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            <FieldError message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label>{t('price')}</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                error={!!errors.price}
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                  setErrors((currentErrors) => ({ ...currentErrors, price: '' }));
                }}
                className="pe-14"
              />
              <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-secondary">EGP</span>
            </div>
            <FieldError message={errors.price} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">
              Category
              <span className="ms-1 text-xs text-tertiary">(optional)</span>
            </label>
            <CategorySelect
              categories={localCategories}
              value={categoryId}
              shopId={shopId}
              onChange={setCategoryId}
              onCategoryCreated={(newCategory) =>
                setLocalCategories((prev) => [...prev, newCategory])
              }
            />
            {localCategories.length === 0 && (
              <p className="text-xs text-tertiary">
                No categories yet -
                <Link href={`/${locale}/products`} className="ms-1 text-[var(--accent-navy)] underline">
                  create one on the products page
                </Link>
              </p>
            )}
          </div>
          <label className="flex items-center gap-3 text-sm text-primary">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4" />
            Product is active
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-tertiary">{t('variants')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.length === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sizes">Sizes</Label>
                  <Input id="sizes" value={sizeInput} onChange={(event) => setSizeInput(event.target.value)} placeholder="S, M, L, XL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colors">Colors</Label>
                  <Input id="colors" value={colorInput} onChange={(event) => setColorInput(event.target.value)} placeholder="Black, Red, White" />
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={generateVariants} disabled={!sizeInput.trim() && !colorInput.trim()}>
                Generate Variants
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary">{variantCountLabel}</p>
                <Button type="button" variant="link" className="h-auto min-h-0 px-0 py-0 text-secondary" onClick={resetVariants}>
                  Reset
                </Button>
              </div>

              <div className="space-y-0">
                <div className="grid grid-cols-[48px_1fr_220px_130px_36px] gap-3 items-center border-b border-[var(--border)] pb-2">
                  <span className="text-2xs font-medium uppercase tracking-widest text-secondary">Image</span>
                  <span className="text-2xs font-medium uppercase tracking-widest text-secondary">Variant</span>
                  <span className="text-2xs font-medium uppercase tracking-widest text-secondary">Stock</span>
                  <span className="text-2xs font-medium uppercase tracking-widest text-secondary">Price</span>
                  <span className="text-2xs font-medium uppercase tracking-widest text-secondary"> </span>
                </div>

                {variants.map((variant, index) => {
                  const variantName = buildVariantName(variant.size, variant.color);

                  return (
                    <div
                      key={variant.id}
                      className="grid grid-cols-[48px_1fr_220px_130px_36px] gap-3 items-start border-b border-[var(--border)] py-2.5 last:border-0"
                    >
                      <label htmlFor={`variant-image-${variant.id}`} className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-hover)]">
                        {variant.imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={storageImage(variant.imagePreview, { width: 600, quality: 80 }) ?? variant.imagePreview}
                            alt={variantName}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-[var(--radius-md)] object-cover"
                          />
                        ) : (
                          <ImagePlus size={16} className="text-secondary" />
                        )}
                        <input id={`variant-image-${variant.id}`} type="file" accept="image/*" className="sr-only" onChange={(event) => handleVariantImage(index, event)} />
                      </label>

                      {variant.isManual ? (
                        <div className="min-w-0">
                          <div className="flex flex-col gap-1">
                            <Input
                              value={variant.size}
                              error={!!errors[`variant_${index}_size`] || !!errors[`variant_${index}_color`] || !!errors[`variant_${index}_general`]}
                              onChange={(event) => handleVariantChange(index, 'size', event.target.value)}
                              placeholder="Size (e.g. M)"
                              className="min-h-[36px] w-full text-sm"
                            />
                            <Input
                              value={variant.color}
                              error={!!errors[`variant_${index}_color`] || !!errors[`variant_${index}_size`] || !!errors[`variant_${index}_general`]}
                              onChange={(event) => handleVariantChange(index, 'color', event.target.value)}
                              placeholder="Color (e.g. Black)"
                              className="min-h-[36px] w-full text-sm"
                            />
                          </div>
                          <FieldError message={errors[`variant_${index}_size`] || errors[`variant_${index}_color`] || errors[`variant_${index}_general`]} />
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-primary">{variantName}</span>
                          <FieldError message={errors[`variant_${index}_size`] || errors[`variant_${index}_color`] || errors[`variant_${index}_general`]} />
                        </div>
                      )}

                      <div>
                        <StockAdjuster
                          variantId={variant.id}
                          shopId={shopId}
                          initialStock={parseInt(variant.stock_qty.toString(), 10) || 0}
                          imageUrl={variant.image_url ?? null}
                          price={
                            variant.price_override === '' ? Number(price) || null : Number(variant.price_override)
                          }
                          variantLabel={buildVariantName(variant.size, variant.color)}
                          onStockChange={(nextStock) => handleVariantChange(index, 'stock_qty', String(nextStock))}
                        />
                        <FieldError message={errors[`variant_${index}_stock_qty`]} />
                      </div>
                      <div>
                        <Input
                          type="number"
                          error={!!errors[`variant_${index}_price_override`]}
                          placeholder="Price Override"
                          value={variant.price_override}
                          onChange={(event) => handleVariantChange(index, 'price_override', event.target.value)}
                          className="min-h-[40px] w-[130px] px-2.5"
                        />
                        <FieldError message={errors[`variant_${index}_price_override`]} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariantToDelete(variant.id)}
                        className="rounded p-1.5 text-[var(--danger-text)] transition-colors hover:bg-[var(--danger-bg)]"
                        aria-label={`Delete ${variantName}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Button type="button" variant="link" className="h-auto min-h-0 px-0 py-0 text-secondary" onClick={addVariant}>
                + Add Variant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {adjustments.length > 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <button
            type="button"
            onClick={() => setHistoryExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-primary">
                Stock adjustment history
              </p>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-tertiary">
                {adjustments.length}
              </span>
            </div>
            {historyExpanded ? (
              <ChevronUp size={14} className="text-tertiary" />
            ) : (
              <ChevronDown size={14} className="text-tertiary" />
            )}
          </button>

          <div className="divide-y divide-[var(--border)]">
            {visibleAdjustments.map((adj) => {
              const v = adj.product_variants;
              const variantLabel = [v.size, v.color].filter(Boolean).join(' / ') || v.name;
              const isPositive = adj.adjustment > 0;

              return (
                <div
                  key={adj.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-primary">
                        {variantLabel}
                      </span>
                      {adj.reason && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-secondary">
                          {adj.reason}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-tertiary">
                      {new Date(adj.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        'text-sm font-bold',
                        isPositive ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'
                      )}
                    >
                      {isPositive ? '+' : ''}
                      {adj.adjustment}
                    </span>
                    <span className="whitespace-nowrap text-xs text-tertiary">
                      {adj.stock_before} {'->'} {adj.stock_after}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {adjustments.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setHistoryExpanded((prev) => !prev)}
              className="flex w-full items-center justify-center gap-1 border-t border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--accent-navy)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              {historyExpanded ? (
                <>
                  <ChevronUp size={12} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  Show {adjustments.length - PREVIEW_COUNT} more changes
                </>
              )}
            </button>
          )}
        </div>
      )}

      {adjustments.length === 0 && (
        <div className="py-8 text-center text-xs text-tertiary">
          No stock adjustments yet - use the +/- buttons above to track changes
        </div>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ConfirmDialog
        open={!!variantToDelete}
        title="Remove this variant?"
        message="This variant will be removed from the product. Stock will be cleared."
        confirmLabel="Remove variant"
        cancelLabel="Keep it"
        variant="warning"
        onConfirm={() => {
          if (variantToDelete) {
            removeVariant(variantToDelete);
          }
          setVariantToDelete(null);
        }}
        onCancel={() => setVariantToDelete(null)}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
