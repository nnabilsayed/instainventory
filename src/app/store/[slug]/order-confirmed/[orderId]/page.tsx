import { storageImage } from '@/lib/image';
import { formatPhoneForWhatsApp } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { getThemeVariables } from '@/lib/theme-tokens';
import { CheckCircle2, MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';

type ShopTheme = {
  thank_you_message?: string | null;
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
  status: string;
  checkout_token: string | null;
  subtotal: number | string;
  shipping_fee: number | string | null;
  total: number | string;
  payment_method: string | null;
  address_name: string | null;
  address_phone: string | null;
  source: string;
  shop: ShopRecord | ShopRecord[] | null;
  order_items: OrderItem[] | null;
};

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

function OrderNotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-lg rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This confirmation page is unavailable or does not belong to this store.
        </p>
      </div>
    </div>
  );
}

export default async function StoreOrderConfirmedPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const supabase = createClient();
  const { data: order } = await supabase
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
      address_name,
      address_phone,
      source,
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
    .eq('id', params.orderId)
    .eq('source', 'self_checkout')
    .single();

  const shop = getShop((order as OrderRecord | null)?.shop ?? null);

  if (!order || !shop || shop.slug !== params.slug) {
    return <OrderNotFound />;
  }

  const themeVariables = getThemeVariables(shop.theme?.layout);
  const thankYouMessage = shop.theme?.thank_you_message?.trim();
  const shippingFee = Number(order.shipping_fee) || 0;
  const whatsappMessage = encodeURIComponent(`Hi! I'm contacting about my order #${order.order_number} 🛍`);

  return (
    <div style={themeVariables} className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-4 flex items-center gap-3">
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storageImage(shop.logo_url, { width: 80, height: 80 }) ?? shop.logo_url}
              alt={shop.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-navy)] text-sm font-semibold text-[var(--text-inverse)]">
              {getInitials(shop.name)}
            </div>
          )}
          <div>
            <p className="text-sm text-[var(--text-secondary)]">{shop.name}</p>
          </div>
        </div>

        <section className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-text)]">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Order placed! 🎉</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Order #{order.order_number}</p>

          <div className="my-4 border-t border-[var(--border)]" />

          <div className="text-start text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">What happens next?</p>
            <ol className="mt-3 space-y-2 ps-5">
              <li>The seller will review your order</li>
              <li>You&apos;ll receive a WhatsApp message to confirm</li>
              <li>Your order will be shipped once confirmed</li>
            </ol>
          </div>

          {order.checkout_token ? (
            <a
              href={`/store/${shop.slug}/order/${order.checkout_token}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                minHeight: '48px',
                padding: '12px',
                marginBottom: '12px',
                border: '1.5px solid var(--accent-navy)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                color: 'var(--accent-navy)',
                fontWeight: 500,
                background: 'var(--surface)',
                textDecoration: 'none',
              }}
            >
              <Package size={16} />
              Track your order
            </a>
          ) : null}
        </section>

        <section className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Order summary</h2>

          <div className="space-y-3">
            {(order.order_items ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.product_name}</p>
                  {item.variant_name ? (
                    <p className="text-xs text-[var(--text-secondary)]">{item.variant_name}</p>
                  ) : null}
                </div>

                <div className="shrink-0 text-end">
                  <p className="text-xs text-[var(--text-secondary)]">× {item.quantity}</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{formatPrice(item.line_total)} EGP</p>
                </div>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-[var(--border)]" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)} EGP</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Shipping</span>
              <span>{shippingFee > 0 ? `${formatPrice(shippingFee)} EGP` : 'Free'}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
              <span>Total</span>
              <span>{formatPrice(order.total)} EGP</span>
            </div>
          </div>
        </section>

        {thankYouMessage ? (
          <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--surface-hover)] p-4 text-center text-sm italic text-[var(--text-secondary)]">
            {thankYouMessage}
          </div>
        ) : null}

        {shop.whatsapp ? (
          <Link
            href={`https://wa.me/${formatPhoneForWhatsApp(shop.whatsapp)}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--success-text)] px-4 text-sm font-medium text-[var(--text-inverse)]"
          >
            <MessageCircle size={18} />
            <span>Contact seller on WhatsApp</span>
          </Link>
        ) : null}

        <Link
          href={`/store/${params.slug}`}
          className="mt-4 block text-center text-sm text-[var(--text-secondary)]"
        >
          ← Back to store
        </Link>
      </main>
    </div>
  );
}
