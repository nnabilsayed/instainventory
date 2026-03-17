import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import NewProductForm from './new-product-form';

export default async function NewProductPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('shop_id', shop.id)
    .order('sort_order');

  return <NewProductForm categories={categories ?? []} shopId={shop.id} />;
}
