import { createClient } from '@/lib/supabase/server';
import ProductEditForm from './product-edit-form';
import { notFound } from 'next/navigation';

export default async function EditProductPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!shop) return <div>Shop not found</div>;

  // Fetch product and variants joining together
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variants (*)
    `)
    .eq('id', params.id)
    .eq('shop_id', shop.id)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">Edit Product: {product.name}</h1>
      <ProductEditForm initialData={product} />
    </div>
  );
}
