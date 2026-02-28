'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImagePlus, Trash2, Plus } from 'lucide-react';

interface VariantRow {
  size: string;
  color: string;
  stock_qty: number;
  price_override: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export default function NewProductPage() {
  const t = useTranslations('products');
  const router = useRouter();
  const { locale } = useParams();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [variants, setVariants] = useState<VariantRow[]>([
    { size: '', color: '', stock_qty: 0, price_override: '', imageFile: null, imagePreview: null }
  ]);

  const addVariant = () =>
    setVariants([...variants, { size: '', color: '', stock_qty: 0, price_override: '', imageFile: null, imagePreview: null }]);

  const removeVariant = (i: number) => {
    if (variants[i].imagePreview) URL.revokeObjectURL(variants[i].imagePreview!);
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const updateVariant = (i: number, field: string, value: any) => {
    const n = [...variants];
    n[i] = { ...n[i], [field]: value };
    setVariants(n);
  };

  const handleVariantImage = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const n = [...variants];
    if (n[i].imagePreview) URL.revokeObjectURL(n[i].imagePreview!);
    n[i] = { ...n[i], imageFile: file, imagePreview: URL.createObjectURL(file) };
    setVariants(n);
  };

  const removeVariantImage = (i: number) => {
    const n = [...variants];
    if (n[i].imagePreview) URL.revokeObjectURL(n[i].imagePreview!);
    n[i] = { ...n[i], imageFile: null, imagePreview: null };
    setVariants(n);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) { setError('Shop not found'); setLoading(false); return; }

    // 1. Insert Product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({ shop_id: shop.id, name, description, price: parseFloat(price) })
      .select('id')
      .single();

    if (productError || !product) { setError(productError?.message || 'Failed'); setLoading(false); return; }

    // 2. Insert Variants (one by one so we can upload images per variant)
    for (let idx = 0; idx < variants.length; idx++) {
      const v = variants[idx];
      let imageUrl: string | null = null;

      // Upload variant image if provided
      if (v.imageFile) {
        const ext = v.imageFile.name.split('.').pop();
        const path = `${shop.id}/${product.id}/variant-${idx}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, v.imageFile);
        if (uploadErr) {
          setError(`Image upload failed: ${uploadErr.message}`);
          setLoading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
        imageUrl = publicUrl;
      }

      const variantName = `${v.size || ''}${v.size && v.color ? ' / ' : ''}${v.color || ''}`.trim() || 'Default';

      const { error: varErr } = await supabase.from('product_variants').insert({
        product_id: product.id,
        name: variantName,
        size: v.size || null,
        color: v.color || null,
        stock_qty: parseInt(v.stock_qty.toString()) || 0,
        price_override: v.price_override ? parseFloat(v.price_override) : null,
        image_url: imageUrl,
      });

      if (varErr) { setError(varErr.message); setLoading(false); return; }
    }

    router.push(`/${locale}/products`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('addProduct')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pname">{t('name')}</Label>
              <Input id="pname" required placeholder="e.g. Summer Dress" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea id="desc" placeholder="Tell customers about this product..." className="h-24" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">{t('price')} (EGP)</Label>
              <Input id="price" type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Variants with per-variant image */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t('variants')}</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="w-4 h-4 mr-1" /> Add Variant
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="relative p-4 border rounded-lg bg-slate-50/50">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="flex gap-4">
                  {/* Variant Image */}
                  <div className="flex-shrink-0">
                    {variant.imagePreview ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={variant.imagePreview} alt="variant" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(index)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-white transition-colors">
                        <ImagePlus className="w-5 h-5 text-slate-400 mb-0.5" />
                        <span className="text-[10px] text-slate-400">Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleVariantImage(index, e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Variant Fields */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Size</Label>
                      <Input placeholder="M, L, XL" value={variant.size} onChange={e => updateVariant(index, 'size', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Color</Label>
                      <Input placeholder="Black, Red" value={variant.color} onChange={e => updateVariant(index, 'color', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stock Qty</Label>
                      <Input type="number" min="0" value={variant.stock_qty} onChange={e => updateVariant(index, 'stock_qty', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price Override</Label>
                      <Input type="number" step="0.01" placeholder="Base price" value={variant.price_override} onChange={e => updateVariant(index, 'price_override', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-400">⚠️ Make sure you created a <strong>product-images</strong> bucket in Supabase Storage (set to Public).</p>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</Button>
        </div>
      </form>
    </div>
  );
}
