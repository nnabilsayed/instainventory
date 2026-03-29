import CheckoutError from '@/components/checkout/checkout-error';
import CheckoutFormClient from '@/components/checkout/checkout-form-client';
import { createClient } from '@/lib/supabase/server';

export default async function CheckoutPage({ token, slug }: { token: string; slug: string }) {
  const supabase = createClient();
  let order: any = null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
          *,
          order_items(*, product_variants(name, size, color)),
          shops!inner(name, slug, whatsapp, instapay_name, instapay_number, logo_url)
        `,
      )
      .eq('checkout_token', token)
      .eq('shops.slug', slug)
      .single();

    if (error || !data) {
      return <CheckoutError type="not_found" />;
    }

    order = data;
  } catch {
    return <CheckoutError type="not_found" />;
  }

  if (!order) {
    return <CheckoutError type="not_found" />;
  }

  const shop = Array.isArray(order.shops) ? (order.shops[0] ?? null) : (order.shops ?? null);
  const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
  const normalizedOrder = {
    ...order,
    order_items: orderItems,
  };

  if (normalizedOrder.status !== 'draft') {
    return <CheckoutError type="already_submitted" status={normalizedOrder.status} />;
  }

  if (normalizedOrder.expires_at && new Date(normalizedOrder.expires_at) < new Date()) {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', normalizedOrder.id);
    return <CheckoutError type="expired" shopWhatsapp={shop?.whatsapp} />;
  }

  return <CheckoutFormClient order={normalizedOrder} shop={shop} trackingToken={token} storeSlug={slug} />;
}
