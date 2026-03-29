import { OrdersClient } from './orders-client';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function OrdersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id, slug').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, total, payment_method, created_at, expires_at, checkout_token, source, customers(name, phone)',
    )
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  return <OrdersClient orders={orders ?? []} locale={locale} shopId={shop.id} shopSlug={shop.slug} />;
}
