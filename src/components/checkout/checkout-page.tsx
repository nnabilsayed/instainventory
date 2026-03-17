import CheckoutError from '@/components/checkout/checkout-error';
import CheckoutFormClient from '@/components/checkout/checkout-form-client';
import { createClient } from '@/lib/supabase/server';

export default async function CheckoutPage({ token }: { token: string }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
        *,
        order_items(*, product_variants(name, size, color)),
        shops(name, slug, whatsapp, instapay_name, instapay_number, logo_url)
      `,
    )
    .eq('checkout_token', token)
    .single();

  if (!order) {
    return <CheckoutError type="not_found" />;
  }

  if (order.status !== 'draft') {
    return <CheckoutError type="already_submitted" status={order.status} />;
  }

  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return <CheckoutError type="expired" shopWhatsapp={order.shops?.whatsapp} />;
  }

  return <CheckoutFormClient order={order} shop={order.shops} />;
}
