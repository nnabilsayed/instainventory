'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

export default function ProductEditForm({ initialData }: { initialData: any }) {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [price, setPrice] = useState(initialData.price?.toString() || '0');
  const [isActive, setIsActive] = useState(initialData.is_active);
  
  // Format initial variants or provide a default one
  const [variants, setVariants] = useState<any[]>(
    initialData.product_variants && initialData.product_variants.length > 0
      ? initialData.product_variants
      : [{ id: 'new-1', size: '', color: '', stock_qty: 0, price_override: '' }]
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { locale } = useParams();

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { id: `new-${Date.now()}`, size: '', color: '', stock_qty: 0, price_override: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // 1. Update main product
    const { error: productError } = await supabase
      .from('products')
      .update({
        name,
        description,
        price: parseFloat(price),
        is_active: isActive,
      })
      .eq('id', initialData.id);

    if (productError) {
      setError(productError.message);
      setLoading(false);
      return;
    }

    // 2. Upsert Variants
    // To handle upsert properly, new items won't have a valid UUID. We split them.
    const toUpdate = variants.filter(v => !v.id.startsWith('new-')).map(v => ({
      ...v,
      name: `${v.size || ''} - ${v.color || ''}`.trim().replace(/^-|-$/g, '').trim() || 'Default',
      stock_qty: parseInt(v.stock_qty) || 0,
      price_override: v.price_override ? parseFloat(v.price_override) : null
    }));

    const toInsert = variants.filter(v => v.id.startsWith('new-')).map(v => {
      const { id, ...rest } = v; // remove 'new-*' id
      return {
        ...rest,
        product_id: initialData.id,
        name: `${v.size || ''} - ${v.color || ''}`.trim().replace(/^-|-$/g, '').trim() || 'Default',
        stock_qty: parseInt(v.stock_qty) || 0,
        price_override: v.price_override ? parseFloat(v.price_override) : null
      };
    });

    if (toUpdate.length > 0) {
      const { error: errUpdate } = await supabase.from('product_variants').upsert(toUpdate);
      if (errUpdate) setError(errUpdate.message);
    }

    if (toInsert.length > 0) {
      const { error: errInsert } = await supabase.from('product_variants').insert(toInsert);
      if (errInsert) setError(errInsert.message);
    }

    setLoading(false);
    if (!error) {
      router.push(`/${locale}/products`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Product Information */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Product Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-md p-2 h-24" />
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Price (EGP)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required className="w-full border rounded-md p-2" />
            </div>
            <div className="flex-1 mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm font-medium">Product is Active</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Variants List */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Inventory & Variants</h2>
          <button type="button" onClick={addVariant} className="text-sm bg-slate-100 px-3 py-1 rounded hover:bg-slate-200">
            + Add Variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((v, idx) => (
            <div key={v.id} className="flex gap-3 items-end p-4 border rounded-md bg-slate-50 relative">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium mb-1">Size</label>
                <input type="text" value={v.size || ''} onChange={e => handleVariantChange(idx, 'size', e.target.value)} className="w-full border rounded p-2 text-sm" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium mb-1">Color</label>
                <input type="text" value={v.color || ''} onChange={e => handleVariantChange(idx, 'color', e.target.value)} className="w-full border rounded p-2 text-sm" />
              </div>
              <div className="flex-1 w-full relative">
                <label className="block text-xs font-medium mb-1">Stock
                  {v.stock_qty <= (v.low_stock_threshold || 3) && <span className="text-red-500 ml-2">Low!</span>}
                </label>
                <input type="number" value={v.stock_qty || 0} onChange={e => handleVariantChange(idx, 'stock_qty', e.target.value)} className="w-full border rounded p-2 text-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

      <div className="flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-md hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
