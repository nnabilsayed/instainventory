import { createClient } from '@/lib/supabase/server';
import { ProductsClient } from './products-client';

export const revalidate = 0;

export default async function ProductsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id, name').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        is_active,
        category_id,
        product_variants(id, name, size, color, stock_qty, image_url, price_override),
        categories(id, name)
      `)
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('shop_id', shop.id)
      .order('sort_order', { ascending: true }),
  ]);

  if (productsResult.error || categoriesResult.error) {
    throw productsResult.error ?? categoriesResult.error;
  }

  const products = (productsResult.data ?? []).map((product: any) => ({
    ...product,
    categories: Array.isArray(product.categories) ? (product.categories[0] ?? null) : product.categories,
    product_variants: (product.product_variants ?? []).map((variant: any) => ({
      ...variant,
      stock_qty: Number(variant.stock_qty) || 0,
    })),
  }));
  const categories = categoriesResult.data ?? [];

  return (
    <ProductsClient
      products={products}
      categories={categories}
      shopId={shop.id}
      locale={locale}
    />
  );
}
