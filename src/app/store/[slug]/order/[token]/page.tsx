import { StatusBadge, type OrderStatus } from '@/components/ui/status-badge';
import { storageImage } from '@/lib/image';
import { formatPhoneForWhatsApp } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { getThemeVariables } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { CheckCircle2, Lock, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import Link from 'next/link';

type ShopTheme = {
  layout?: Record<string, unknown> | null;
} | null;

type ShopRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  whatsapp: string | null;
  theme: ShopTheme;
};

type OrderItem = {
  id: string;
  product_name: string;
  variant_name: string | null;
  unit_price: number | string;
  quantity: number;
  line_total: number | string;
};

type OrderRecord = {
  id: string;
  order_number: number;
  status: OrderStatus;
  checkout_token: string;
  subtotal: number | string;
  shipping_fee: number | string | null;
  total: number | string;
  payment_method: string | null;
  address_city: string | null;
  address_area: string | null;
  pending_at: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  shop: ShopRecord | ShopRecord[] | null;
  order_items: OrderItem[] | null;
};

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instainventory.com';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'S').slice(0, 2);
}

function formatPrice(value: number | string | null | undefined) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function getShop(shop: OrderRecord['shop']) {
  return Array.isArray(shop) ? (shop[0] ?? null) : shop;
}

function getStatusTimestamp(order: OrderRecord) {
  const timestampMap: Record<OrderStatus, string | null | undefined> = {
    draft: null,
    pending: order.pending_at,
    confirmed: order.confirmed_at,
    shipped: order.shipped_at,
    delivered: order.delivered_at,
    cancelled: order.cancelled_at ?? order.shipped_at ?? order.confirmed_at ?? order.pending_at,
  };

  const ts = timestampMap[order.status];
  return ts ? format(new Date(ts), 'PPP p') : null;
}

function getStatusMessage(status: OrderStatus) {
  const messages: Record<OrderStatus, string> = {
    draft: 'Your order is being prepared for checkout.',
    pending: 'Your order is waiting for seller confirmation',
    confirmed: 'Great! Your order has been confirmed and is being prepared',
    shipped: 'Your order is on its way! 🚚',
    delivered: 'Your order has been delivered. Enjoy! 🎉',
    cancelled: 'This order has been cancelled. Please contact the seller for more information.',
  };

  return messages[status];
}

function getReachedIndex(order: OrderRecord) {
  if (order.status !== 'cancelled') {
    return Math.max(STEPS.indexOf(order.status as (typeof STEPS)[number]), 0);
  }

  if (order.delivered_at) return 3;
  if (order.shipped_at) return 2;
  if (order.confirmed_at) return 1;
  return 0;
}

function OrderNotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-4 text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <h1 className="text-xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This order could not be found or does not belong to this store.
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; token: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select(`
        order_number,
        status,
        shop:shops(name, slug, logo_url)
      `)
      .eq('checkout_token', params.token)
      .single();

    const order = data as {
      order_number: number;
      status: OrderStatus;
      shop:
        | { name: string; slug: string; logo_url: string | null }
        | { name: string; slug: string; logo_url: string | null }[]
        | null;
    } | null;
    const shop = Array.isArray(order?.shop) ? (order.shop[0] ?? null) : order?.shop;

    if (!order || !shop || shop.slug !== params.slug) {
      return {};
    }

    const statusEmoji: Record<OrderStatus, string> = {
      draft: '⏳',
      pending: '⏳',
      confirmed: '✅',
      shipped: '🚚',
      delivered: '🎉',
      cancelled: '❌',
    };
    const title = `${statusEmoji[order.status]} Order #${order.order_number} — ${shop.name}`;
    const description = `Track your order from ${shop.name}`;
    const imageUrl = shop.logo_url ?? null;
    const url = `${APP_URL}/store/${params.slug}/order/${params.token}`;

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

export default async function StoreOrderStatusPage({
  params,
}: {
  params: { slug: string; token: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      status,
      checkout_token,
      subtotal,
      shipping_fee,
      total,
      payment_method,
      address_city,
      address_area,
      pending_at,
      confirmed_at,
      shipped_at,
      delivered_at,
      cancelled_at,
      shop:shops (
        id,
        name,
        slug,
        logo_url,
        whatsapp,
        theme
      ),
      order_items (
        id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        line_total
      )
    `,
    )
    .eq('checkout_token', params.token)
    .single();

  const order = data as OrderRecord | null;
  const shop = getShop(order?.shop ?? null);

  if (!order || !shop || shop.slug !== params.slug) {
    return <OrderNotFound />;
  }

  const themeVariables = getThemeVariables(shop.theme?.layout);
  const shippingFee = Number(order.shipping_fee) || 0;
  const statusTimestamp = getStatusTimestamp(order);
  const reachedIndex = getReachedIndex(order);
  const isCancelled = order.status === 'cancelled';
  const whatsappMessage = encodeURIComponent(`Hi! I'm contacting about my order #${order.order_number} 🛍`);

  return (
    <div style={themeVariables} className="min-h-screen bg-[var(--background)] px-4 py-4 text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storageImage(shop.logo_url, { width: 80, height: 80 }) ?? shop.logo_url}
                alt={shop.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-navy)] text-sm font-medium text-white">
                {getInitials(shop.name)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-[var(--text-primary)]">{shop.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">Order #{order.order_number}</p>
            </div>

            <div className="ms-auto flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Lock size={14} />
              <span>Secure</span>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={order.status} />
            <span className="text-xs text-[var(--text-secondary)]">{statusTimestamp ?? ''}</span>
          </div>

          <div className="mt-4 flex items-start">
            {STEPS.map((step, index) => {
              const isCurrent = !isCancelled && order.status === step;
              const isCompleted = !isCancelled && index < reachedIndex;
              const isReachedCancelled = isCancelled && index === reachedIndex;
              const isUpcoming = !isCompleted && !isCurrent && !isReachedCancelled;

              return (
                <div key={step} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full',
                        isCompleted && 'bg-[var(--accent-navy)] text-white',
                        isCurrent && 'border-2 border-[var(--accent-navy)] bg-[var(--surface)]',
                        (isUpcoming || isCancelled) && 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-tertiary)]',
                      )}
                    >
                      {isCompleted ? <CheckCircle2 size={14} /> : null}
                      {isCurrent ? <span className="h-[10px] w-[10px] rounded-full bg-[var(--accent-navy)]" /> : null}
                      {isReachedCancelled ? <X size={14} /> : null}
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-center text-[10px]',
                        isCurrent ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]',
                      )}
                    >
                      {STEP_LABELS[step]}
                    </p>
                  </div>

                  {index < STEPS.length - 1 ? (
                    <div
                      className={cn(
                        'mt-[13px] h-[2px] flex-1',
                        !isCancelled && index < reachedIndex ? 'bg-[var(--accent-navy)]' : 'bg-[var(--border)]',
                      )}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-center text-sm text-[var(--text-secondary)]">{getStatusMessage(order.status)}</p>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--text-secondary)]">
            Order summary
          </p>

          <div>
            {(order.order_items ?? []).map((item) => (
              <div key={item.id} className="mb-2 rounded-[var(--radius-md)] bg-[var(--background)] p-3 last:mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.variant_name}</p>
                  </div>

                  <div className="shrink-0 text-end text-sm text-[var(--text-secondary)]">
                    {item.quantity} × {formatPrice(item.unit_price)} EGP
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)} EGP</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>Shipping</span>
              <span>{shippingFee > 0 ? `${formatPrice(shippingFee)} EGP` : 'Free'}</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2" />
            <div className="flex items-center justify-between text-sm font-medium text-[var(--text-primary)]">
              <span>Total</span>
              <span>{formatPrice(order.total)} EGP</span>
            </div>
          </div>

          {order.address_area || order.address_city ? (
            <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-secondary)]">
              Delivering to: {[order.address_area, order.address_city].filter(Boolean).join(', ')}
            </div>
          ) : null}
        </section>

        {shop.whatsapp && order.status !== 'delivered' && order.status !== 'cancelled' ? (
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="mb-3 text-sm text-[var(--text-secondary)]">Have a question about your order?</p>
            <Link
              href={`https://wa.me/${formatPhoneForWhatsApp(shop.whatsapp)}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--success-text)] px-4 text-sm font-medium text-white"
            >
              <MessageCircle size={16} />
              <span>Contact seller on WhatsApp</span>
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
