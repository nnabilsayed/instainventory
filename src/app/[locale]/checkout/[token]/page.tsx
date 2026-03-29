import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

export default async function CheckoutTokenPage({
  params,
}: {
  params: { token: string; locale: string };
}) {
  const supabase = createClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('shops!inner(slug)')
    .eq('checkout_token', params.token)
    .single();

  if (error || !order) {
    notFound();
  }

  const shopRelation = (order as { shops?: { slug?: string } | Array<{ slug?: string }> }).shops;
  const shop = Array.isArray(shopRelation) ? (shopRelation[0] ?? null) : (shopRelation ?? null);

  if (!shop?.slug) {
    notFound();
  }

  redirect(`/store/${shop.slug}/checkout/${params.token}`);
}
