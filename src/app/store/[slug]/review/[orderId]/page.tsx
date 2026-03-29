import { ReviewFormClient } from './review-form-client';
import { storageImage } from '@/lib/image';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getThemeVariables } from '@/lib/theme-tokens';
import Link from 'next/link';

type ShopTheme = {
  layout?: Record<string, unknown> | null;
} | null;

type ShopRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme: ShopTheme;
};

type OrderRecord = {
  id: string;
  order_number: number;
  status: string;
  address_name: string | null;
  shop: ShopRecord | ShopRecord[] | null;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'S').slice(0, 2);
}

function getShop(shop: OrderRecord['shop']) {
  return Array.isArray(shop) ? (shop[0] ?? null) : shop;
}

function ReviewMessage({
  shopSlug,
  title,
  description,
}: {
  shopSlug?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
      <h1 className="text-base font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
      {shopSlug ? (
        <Link
          href={`/store/${shopSlug}`}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-[var(--accent-navy)]"
        >
          ← Back to store
        </Link>
      ) : null}
    </section>
  );
}

export default async function StoreReviewPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const [{ data: order }, { data: existing }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select(
        `
          id,
          order_number,
          status,
          address_name,
          shop:shops(id, name, slug, logo_url, theme)
        `,
      )
      .eq('id', params.orderId)
      .maybeSingle(),
    supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('order_id', params.orderId)
      .maybeSingle(),
  ]);

  const typedOrder = order as OrderRecord | null;
  const shop = getShop(typedOrder?.shop ?? null);
  const themeVariables = getThemeVariables(shop?.theme?.layout);

  return (
    <div style={themeVariables} className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-[480px] px-4 py-6">
        {!typedOrder || !shop || shop.slug !== params.slug ? (
          <ReviewMessage
            title="Invalid review link"
            description="This review link is not valid for this store."
          />
        ) : typedOrder.status !== 'delivered' ? (
          <ReviewMessage
            shopSlug={shop.slug}
            title="Reviews can only be submitted for delivered orders"
            description="Please come back after the order has been marked as delivered."
          />
        ) : existing ? (
          <ReviewMessage
            shopSlug={shop.slug}
            title="You've already submitted a review for this order. Thank you! 🎉"
            description="We appreciate you taking the time to share your feedback."
          />
        ) : (
          <>
            <section className="mb-4 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storageImage(shop.logo_url, { width: 80, height: 80 }) ?? shop.logo_url}
                  alt={shop.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-navy)] text-sm font-medium text-[var(--text-inverse)]">
                  {getInitials(shop.name)}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[var(--text-primary)]">{shop.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">Leave a review</p>
              </div>
            </section>

            <ReviewFormClient
              orderId={typedOrder.id}
              orderNumber={typedOrder.order_number}
              shopId={shop.id}
              shopSlug={shop.slug}
              initialName={typedOrder.address_name?.trim() || ''}
            />
          </>
        )}
      </main>
    </div>
  );
}
