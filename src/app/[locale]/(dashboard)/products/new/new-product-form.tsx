'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySelect } from '@/components/category-select';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { productSchema, variantSchema } from '@/lib/validations';
import { ImagePlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, useState } from 'react';

interface VariantRow {
  size: string;
  color: string;
  isManual: boolean;
  stock_qty: number | string;
  price_override: string;
  imageFile: File | null;
  imagePreview: string | null;
}

type CategoryOption = {
  id: string;
  name: string;
};

const parseTags = (input: string) => input.split(',').map((s) => s.trim()).filter(Boolean);

const buildVariantName = (size: string, color: string) =>
  `${size || ''}${size && color ? ' / ' : ''}${color || ''}`.trim() || 'Default';

const createVariantRow = (size = '', color = '', isManual = false): VariantRow => ({
  size,
  color,
  isManual,
  stock_qty: 0,
  price_override: '',
  imageFile: null,
  imagePreview: null,
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

export default function NewProductForm({
  categories,
  shopId,
}: {
  categories: CategoryOption[];
  shopId: string;
}) {
  const t = useTranslations('products');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  const generateVariants = () => {
    const sizes = parseTags(sizeInput);
    const colors = parseTags(colorInput);
    setVariants(generateVariantRows(sizes, colors));
  };

  const addVariant = () => {
    setVariants((currentVariants) => [...currentVariants, createVariantRow('', '', true)]);
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: string) => {
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

  const removeVariant = (index: number) => {
    const preview = variants[index]?.imagePreview;
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setVariants((currentVariants) => currentVariants.filter((_, itemIndex) => itemIndex !== index));
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
      is_active: true,
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      notify.productError();
      setLoading(false);
      return;
    }

    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) {
      setError('Shop not found');
      notify.productError();
      setLoading(false);
      return;
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        shop_id: shop.id,
        name,
        description,
        price: parseFloat(price),
        category_id: categoryId,
      })
      .select('id')
      .single();

    if (productError || !product) {
      setError(productError?.message || 'Failed');
      notify.productError();
      setLoading(false);
      return;
    }

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      let imageUrl: string | null = null;

      if (variant.imageFile) {
        const ext = variant.imageFile.name.split('.').pop();
        const path = `${shop.id}/${product.id}/variant-${index}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, variant.imageFile);
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

      const variantName = buildVariantName(variant.size, variant.color);

      const { error: variantError } = await supabase.from('product_variants').insert({
        product_id: product.id,
        name: variantName,
        size: variant.size || null,
        color: variant.color || null,
        stock_qty: parseInt(variant.stock_qty.toString(), 10) || 0,
        price_override: variant.price_override ? parseFloat(variant.price_override) : null,
        image_url: imageUrl,
      });

      if (variantError) {
        setError(variantError.message);
        notify.productError();
        setLoading(false);
        return;
      }
    }

    notify.productSaved();
    router.push(`/${locale}/products`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-primary">{t('addProduct')}</h1>
        <p className="text-sm text-secondary">Add the core details first, then define your variants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-tertiary">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname">{t('name')}</Label>
            <Input
              id="pname"
              required
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
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            <FieldError message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t('price')}</Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.01"
                required
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
              <Button type="button" className="w-full" onClick={generateVariants} disabled={!sizeInput.trim() && !colorInput.trim()}>
                Generate Variants
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary">{variants.length} variants</p>
                <Button type="button" variant="link" className="h-auto min-h-0 px-0 py-0 text-secondary" onClick={resetVariants}>
                  Reset
                </Button>
              </div>

              <div className="space-y-0">
                <div className="grid grid-cols-[48px_1fr_90px_130px_36px] gap-3 items-center border-b border-[var(--border)] pb-2">
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
                      key={`${variant.size}-${variant.color}-${index}`}
                      className="grid grid-cols-[48px_1fr_90px_130px_36px] gap-3 items-center border-b border-[var(--border)] py-2.5 last:border-0"
                    >
                      <label htmlFor={`variant-image-${index}`} className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-hover)]">
                        {variant.imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={variant.imagePreview} alt={variantName} className="h-full w-full rounded-[var(--radius-md)] object-cover" />
                        ) : (
                          <ImagePlus size={16} className="text-secondary" />
                        )}
                        <input id={`variant-image-${index}`} type="file" accept="image/*" className="sr-only" onChange={(event) => handleVariantImage(index, event)} />
                      </label>

                      {variant.isManual ? (
                        <div className="min-w-0">
                          <div className="flex flex-col gap-1">
                            <Input
                              value={variant.size}
                              error={!!errors[`variant_${index}_size`] || !!errors[`variant_${index}_color`] || !!errors[`variant_${index}_general`]}
                              onChange={(event) => updateVariant(index, 'size', event.target.value)}
                              placeholder="Size (e.g. M)"
                              className="min-h-[36px] w-full text-sm"
                            />
                            <Input
                              value={variant.color}
                              error={!!errors[`variant_${index}_color`] || !!errors[`variant_${index}_size`] || !!errors[`variant_${index}_general`]}
                              onChange={(event) => updateVariant(index, 'color', event.target.value)}
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
                        <Input
                          type="number"
                          min="0"
                          error={!!errors[`variant_${index}_stock_qty`]}
                          value={variant.stock_qty}
                          onChange={(event) => updateVariant(index, 'stock_qty', event.target.value)}
                          className="min-h-[40px] w-[90px] px-2.5"
                        />
                        <FieldError message={errors[`variant_${index}_stock_qty`]} />
                      </div>
                      <div>
                        <Input
                          type="number"
                          error={!!errors[`variant_${index}_price_override`]}
                          placeholder="Price Override"
                          value={variant.price_override}
                          onChange={(event) => updateVariant(index, 'price_override', event.target.value)}
                          className="min-h-[40px] w-[130px] px-2.5"
                        />
                        <FieldError message={errors[`variant_${index}_price_override`]} />
                      </div>
                      <button type="button" onClick={() => removeVariant(index)} className="flex h-9 w-9 items-center justify-center text-[var(--danger-text)]" aria-label={`Delete ${variantName}`}>
                        <Trash2 size={16} />
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}
