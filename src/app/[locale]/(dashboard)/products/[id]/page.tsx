import { createClient } from '@/lib/supabase/server';
import ProductEditForm from './product-edit-form';
import { notFound } from 'next/navigation';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!shop) return <div>Shop not found</div>;

  const id = params.id;
  const [productResult, variantsResult, imagesResult, adjustmentsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single(),
    supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id),
    supabase
      .from('stock_adjustments')
      .select(`
        id,
        adjustment,
        reason,
        stock_before,
        stock_after,
        created_at,
        variant_id,
        product_variants!inner(
          id,
          name,
          size,
          color,
          products!inner(id)
        )
      `)
      .eq('product_variants.products.id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('categories')
      .select('id, name')
      .eq('shop_id', shop.id)
      .order('sort_order'),
  ]);

  if (
    productResult.error ||
    variantsResult.error ||
    imagesResult.error ||
    adjustmentsResult.error ||
    categoriesResult.error
  ) {
    throw (
      productResult.error ??
      variantsResult.error ??
      imagesResult.error ??
      adjustmentsResult.error ??
      categoriesResult.error
    );
  }

  const product = productResult.data
    ? {
        ...productResult.data,
        product_variants: variantsResult.data ?? [],
        product_images: imagesResult.data ?? [],
      }
    : null;
  const adjustments = (adjustmentsResult.data ?? []).map((adjustment) => ({
    id: adjustment.id,
    adjustment: adjustment.adjustment,
    reason: adjustment.reason,
    stock_before: adjustment.stock_before,
    stock_after: adjustment.stock_after,
    created_at: adjustment.created_at,
    variant_id: adjustment.variant_id,
    product_variants: Array.isArray(adjustment.product_variants)
      ? adjustment.product_variants[0]
      : adjustment.product_variants,
  }));

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h1 className="mb-6 text-xl font-semibold text-primary">Edit Product: {product.name}</h1>
      <ProductEditForm
        product={product}
        adjustments={adjustments}
        categories={categoriesResult.data ?? []}
        shopId={shop.id}
      />
    </div>
  );
}
