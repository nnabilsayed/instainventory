import BreadcrumbSync from './breadcrumb-sync';
import DiscountEditor from './discount-editor';
import OrderActions from './order-actions';
import OrderExpiryBanner from './order-expiry-banner';
import ReceiptModal from './receipt-modal';
import { getAppUrl } from '@/lib/app-url';
import { formatPhoneDisplay } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { getExpiryRelativeLabel, isOpenCheckoutStatus, isOrderExpired } from '@/lib/order-expiry';
import { buildWhatsAppUrl, getOrderMessage } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

export const revalidate = 0;

function getPaymentMethodLabel(method: string | null) {
  if (method === 'cod') return 'Cash on Delivery';
  if (method === 'instapay') return 'InstaPay';
  return 'Not selected';
}

function getWhatsAppNotification(status: string, params: Parameters<typeof getOrderMessage>[1]) {
  const messageConfig = {
    draft: { label: 'Send Checkout Link via WhatsApp', type: 'checkout_link' as const },
    pending: { label: 'Payment received - notify via WhatsApp', type: 'confirmed' as const },
    confirmed: { label: 'Order Confirmed - notify via WhatsApp', type: 'confirmed' as const },
    shipped: { label: 'Order Shipped - notify via WhatsApp', type: 'shipped' as const },
    delivered: { label: 'Order Delivered - notify via WhatsApp', type: 'delivered' as const },
    cancelled: null,
  };

  const msg = messageConfig[status as keyof typeof messageConfig];

  if (!msg) {
    return null;
  }

  return {
    label: msg.label,
    message: getOrderMessage(msg.type, params),
  };
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Unauthorized</div>;
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, slug, whatsapp, auto_whatsapp_notifications')
    .eq('owner_id', user.id)
    .single();

  if (!shop) {
    return <div className="p-6">Shop not found</div>;
  }

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .eq('shop_id', shop.id)
    .single();

  if (orderError || !orderData) {
    notFound();
  }

  const [orderItemsResult, customerResult] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', orderData.id),
    orderData.customer_id
      ? supabase.from('customers').select('*').eq('id', orderData.customer_id).eq('shop_id', shop.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (orderItemsResult.error || customerResult.error) {
    throw orderItemsResult.error ?? customerResult.error;
  }

  let order = {
    ...orderData,
    customers: customerResult.data,
    order_items: orderItemsResult.data ?? [],
  };

  if (isOrderExpired(order.expires_at) && isOpenCheckoutStatus(order.status)) {
    const { error: expiryError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)
      .in('status', ['draft', 'pending']);

    if (!expiryError) {
      order = {
        ...order,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      };
    }
  }

  const checkoutUrl = `${getAppUrl()}/store/${shop.slug}/checkout/${order.checkout_token}`;
  const expiryLabel = getExpiryRelativeLabel(order.expires_at);
  const paymentMethodLabel = getPaymentMethodLabel(order.payment_method);
  const messageParams = {
    customerName: order.customers?.name ?? 'Customer',
    orderId: order.id,
    orderNumber: order.order_number,
    shopName: shop.name,
    shopSlug: shop.slug,
    checkoutToken: order.checkout_token,
    checkoutLink: checkoutUrl,
    total: Number(order.total),
  };
  const whatsappNotification = getWhatsAppNotification(order.status, messageParams);
  const whatsappUrl =
    order.customers?.phone && whatsappNotification
      ? buildWhatsAppUrl(order.customers.phone, whatsappNotification.message)
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <BreadcrumbSync label={`Order #${order.order_number}`} />

      <a href={`/${params.locale}/orders`} className="text-sm text-slate-600 hover:text-slate-900">
        Back to orders
      </a>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">Order #{order.order_number}</h1>
            {order.source === 'self_checkout' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'var(--info-bg)',
                  color: 'var(--info-text)',
                  marginInlineStart: '8px',
                }}
              >
                Self-checkout
              </span>
            ) : null}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{order.status}</span>
          {expiryLabel ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{expiryLabel}</span> : null}
        </div>
        <p className="mt-2 text-sm text-slate-500">Created on {format(new Date(order.created_at), 'PPP')}</p>

        {order.status === 'draft' && order.expires_at ? (
          <div className="mt-4">
            <OrderExpiryBanner orderId={order.id} expiresAt={order.expires_at} />
          </div>
        ) : null}

        <div className="mt-4">
          <OrderActions
            orderId={order.id}
            status={order.status}
            orderNumber={order.order_number}
            addressName={order.address_name ?? order.customers?.name ?? 'Customer'}
            checkoutToken={order.checkout_token}
            shop={{
              slug: shop.slug,
              whatsapp: shop.whatsapp,
              autoWhatsappNotifications: shop.auto_whatsapp_notifications ?? true,
            }}
          />
        </div>
        {order.status === 'draft' ? (
          <div className="mt-4">
            <DiscountEditor
              orderId={order.id}
              currentType={order.discount_type}
              currentValue={Number(order.discount_value) || 0}
              currentAmount={Number(order.discount_amount) || 0}
              subtotal={Number(order.subtotal) || 0}
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Customer</h2>
        <p className="mt-3 text-slate-900">{order.customers?.name || 'Unknown customer'}</p>
        <p className="text-sm text-slate-600">
          {order.customers?.phone ? formatPhoneDisplay(order.customers.phone) : 'No phone'}
        </p>
        {order.customers?.instagram ? <p className="text-sm text-slate-600">@{String(order.customers.instagram).replace('@', '')}</p> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
        <div className="mt-4 space-y-3">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-sm text-slate-600">{item.variant_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.quantity} x {item.unit_price} EGP
                  </p>
                </div>
                <p className="font-semibold text-slate-900">{item.line_total} EGP</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{order.subtotal} EGP</span>
          </div>
          {Number(order.discount_amount) > 0 ? (
            <div className="flex justify-between text-sm py-1">
              <span className="flex items-center gap-1.5 text-[var(--success-text)]">
                Discount
                {order.discount_type === 'percentage' ? (
                  <span className="rounded-full bg-[var(--success-bg)] px-1.5 py-0.5 text-xs">
                    {order.discount_value}% off
                  </span>
                ) : null}
                {order.discount_type === 'fixed' ? (
                  <span className="rounded-full bg-[var(--success-bg)] px-1.5 py-0.5 text-xs">
                    Fixed
                  </span>
                ) : null}
              </span>
              <span className="font-medium text-[var(--success-text)]">
                - {Number(order.discount_amount).toFixed(2)} EGP
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-slate-600">
            <span>Shipping</span>
            <span>{order.shipping_fee} EGP</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>{order.total} EGP</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Delivery Address</h2>
        {order.address_city ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>Recipient: {order.address_name}</p>
            <p>Phone: {order.address_phone ? formatPhoneDisplay(order.address_phone) : 'No phone'}</p>
            <p>Region: {order.address_city} - {order.address_area}</p>
            <p>Address: {order.address_street}</p>
            {order.notes ? <p>Notes: {order.notes}</p> : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Address not provided yet. The customer will fill this during checkout.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
        <p className="mt-4 text-sm text-slate-700">{paymentMethodLabel}</p>
        {order.payment_method === 'instapay' && order.payment_proof_url ? (
          <ReceiptModal fileUrl={order.payment_proof_url} />
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Checkout Link</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            readOnly
            value={checkoutUrl}
            className="min-h-[44px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
          />
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 px-4 text-sm text-slate-900 hover:bg-slate-50"
          >
            Open Link
          </a>
        </div>
      </div>

      {whatsappUrl ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white hover:bg-[#20C05C]"
          >
            {whatsappNotification?.label}
          </a>
        </div>
      ) : null}
    </div>
  );
}
