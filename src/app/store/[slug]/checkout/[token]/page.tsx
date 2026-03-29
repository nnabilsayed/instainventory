import CheckoutPage from '@/components/checkout/checkout-page';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instainventory.com';

export async function generateMetadata({
  params,
}: {
  params: { token: string; slug: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select(`
        order_number,
        shop:shops(name, slug, logo_url)
      `)
      .eq('checkout_token', params.token)
      .single();

    const order = data as {
      order_number: number;
      shop:
        | { name: string; slug: string; logo_url: string | null }
        | { name: string; slug: string; logo_url: string | null }[]
        | null;
    } | null;
    const shop = Array.isArray(order?.shop) ? (order.shop[0] ?? null) : order?.shop;

    if (!order || !shop || shop.slug !== params.slug) {
      return {};
    }

    const title = `Your order from ${shop.name}`;
    const description = `Complete your order #${order.order_number} from ${shop.name}`;
    const imageUrl = shop.logo_url ?? null;
    const url = `${APP_URL}/store/${params.slug}/checkout/${params.token}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function StoreCheckoutPage({
  params,
}: {
  params: { token: string; slug: string };
}) {
  return <CheckoutPage token={params.token} slug={params.slug} />;
}
