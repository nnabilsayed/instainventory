/*
  SUPABASE WEBHOOKS TO CREATE (Dashboard -> Database -> Webhooks):

  1. Name: order-submitted
     Table: orders, Event: UPDATE
     Filter: status=pending (add condition: NEW.status = 'pending' AND OLD.status = 'draft')
     URL: [NEXT_PUBLIC_APP_URL]/api/notify
     Headers: x-webhook-secret: [WEBHOOK_SECRET], x-event-type: order_submitted

  2. Name: payment-proof-uploaded
     Table: orders, Event: UPDATE
     Filter: payment_proof_url is not null
     URL: [NEXT_PUBLIC_APP_URL]/api/notify
     Headers: x-webhook-secret: [WEBHOOK_SECRET], x-event-type: payment_proof_uploaded

  3. Name: low-stock-alert
     Table: product_variants, Event: UPDATE
     Filter: stock_qty <= low_stock_threshold
     URL: [NEXT_PUBLIC_APP_URL]/api/notify
     Headers: x-webhook-secret: [WEBHOOK_SECRET], x-event-type: low_stock
*/

import { resend } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type WebhookPayload = {
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
  new?: Record<string, unknown> | null;
  old?: Record<string, unknown> | null;
};

type OrderDetails = {
  id: string;
  order_number: number;
  total: number | string;
  payment_method: string | null;
  address_name: string | null;
  address_phone: string | null;
  address_city: string | null;
  shop_id: string;
};

type OrderItem = {
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number | string;
};

type ShopDetails = {
  id: string;
  name: string;
  owner_id: string;
};

type LowStockVariant = {
  id: string;
  name: string;
  stock_qty: number;
  low_stock_threshold: number;
  product_id: string;
  products:
    | {
        id: string;
        name: string;
        shop_id: string;
      }
    | {
        id: string;
        name: string;
        shop_id: string;
      }[];
};

const APP_NAME = 'InstaInventory';
const EMAIL_TEXT = '#111110';
const BUTTON_COLOR = '#1A1A2E';
const MAX_WIDTH = 560;
const DEFAULT_FROM = 'InstaInventory <onboarding@resend.dev>';

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');
}

function getWebhookRecord(payload: WebhookPayload) {
  return payload.record ?? payload.new ?? null;
}

function getOldWebhookRecord(payload: WebhookPayload) {
  return payload.old_record ?? payload.old ?? null;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function getNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value: number | string | null | undefined) {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);

  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EGP`;
}

function getPaymentMethodLabel(method: string | null) {
  if (method === 'cod') return 'COD';
  if (method === 'instapay') return 'InstaPay';
  return 'Unknown';
}

function renderEmail({
  preview,
  title,
  intro,
  sections,
  ctaLabel,
  ctaHref,
}: {
  preview: string;
  title: string;
  intro: string;
  sections: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return `
    <div style="margin:0;background:#ffffff;padding:24px 12px;color:${EMAIL_TEXT};font-family:Arial,sans-serif;font-size:16px;line-height:1.6;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
      <div style="margin:0 auto;max-width:${MAX_WIDTH}px;background:#ffffff;">
        <div style="padding:0 0 24px;border-bottom:1px solid #E7E7E2;">
          <div style="font-size:22px;font-weight:700;letter-spacing:0.01em;color:${EMAIL_TEXT};">${APP_NAME}</div>
        </div>
        <div style="padding:24px 0;">
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:${EMAIL_TEXT};">${escapeHtml(title)}</h1>
          <p style="margin:0 0 24px;color:${EMAIL_TEXT};">${escapeHtml(intro)}</p>
          ${sections}
          <div style="margin-top:28px;">
            <a href="${escapeHtml(ctaHref)}" style="display:inline-block;min-width:200px;padding:14px 20px;border-radius:12px;background:${BUTTON_COLOR};color:#ffffff;text-decoration:none;font-weight:600;text-align:center;">${escapeHtml(
              ctaLabel
            )}</a>
          </div>
        </div>
        <div style="padding:20px 0 0;border-top:1px solid #E7E7E2;color:#66665F;font-size:14px;">
          You're receiving this because you're an InstaInventory seller. Log in to manage notification preferences.
        </div>
      </div>
    </div>
  `;
}

function renderSection(title: string, rows: Array<{ label: string; value: string }>) {
  const items = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;color:#66665F;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;color:${EMAIL_TEXT};text-align:right;vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div style="margin-top:20px;border:1px solid #E7E7E2;border-radius:16px;padding:18px;">
      <div style="margin:0 0 8px;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#66665F;">${escapeHtml(
        title
      )}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${items}
      </table>
    </div>
  `;
}

function renderItemsSection(items: OrderItem[]) {
  const rows = items
    .map((item) => {
      const variant = item.variant_name ? ` · ${item.variant_name}` : '';
      return `
        <tr>
          <td style="padding:12px 0;border-top:1px solid #EFEFEA;">
            <div style="font-weight:600;color:${EMAIL_TEXT};">${escapeHtml(item.product_name)}${escapeHtml(variant)}</div>
            <div style="color:#66665F;">Qty ${escapeHtml(String(item.quantity))}</div>
          </td>
          <td style="padding:12px 0;border-top:1px solid #EFEFEA;text-align:right;font-weight:600;color:${EMAIL_TEXT};">
            ${escapeHtml(formatCurrency(item.unit_price))}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="margin-top:20px;border:1px solid #E7E7E2;border-radius:16px;padding:18px;">
      <div style="margin:0 0 8px;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#66665F;">Items</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${rows}
      </table>
    </div>
  `;
}

async function getSellerEmail(ownerId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(ownerId);

  if (error) {
    throw new Error(`Failed to fetch seller email: ${error.message}`);
  }

  const email = data.user?.email;

  if (!email) {
    throw new Error('Seller email is missing.');
  }

  return email;
}

async function getOrderNotificationContext(orderId: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, total, payment_method, address_name, address_phone, address_city, shop_id')
    .eq('id', orderId)
    .single<OrderDetails>();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Order not found.');
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id, name, owner_id')
    .eq('id', order.shop_id)
    .single<ShopDetails>();

  if (shopError || !shop) {
    throw new Error(shopError?.message ?? 'Shop not found.');
  }

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_name, variant_name, quantity, unit_price')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const sellerEmail = await getSellerEmail(shop.owner_id);

  return {
    order,
    shop,
    items: (items ?? []) as OrderItem[],
    sellerEmail,
  };
}

async function sendSellerEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function handleOrderSubmitted(payload: WebhookPayload) {
  const record = getWebhookRecord(payload);
  const previousRecord = getOldWebhookRecord(payload);
  const orderId = getString(record?.id);
  const status = getString(record?.status);
  const previousStatus = getString(previousRecord?.status);

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order id.' }, { status: 400 });
  }

  if (status !== 'pending' || previousStatus !== 'draft') {
    return NextResponse.json({ skipped: true, reason: 'Order transition does not match.' });
  }

  const { order, items, sellerEmail } = await getOrderNotificationContext(orderId);
  const customerName = order.address_name || 'Customer';
  const orderUrl = `${getAppUrl()}/en/orders/${order.id}`;
  const subject = `New order #${order.order_number} from ${customerName} · ${formatCurrency(order.total)}`;

  const html = renderEmail({
    preview: `New order #${order.order_number} from ${customerName}.`,
    title: 'You have a new order!',
    intro: `A new order just came in for your shop.`,
    sections: `
      ${renderSection('Order details', [
        { label: 'Order number', value: `#${order.order_number}` },
        { label: 'Customer', value: customerName },
        { label: 'Phone', value: order.address_phone || 'Not provided' },
        { label: 'City', value: order.address_city || 'Not provided' },
        { label: 'Payment method', value: getPaymentMethodLabel(order.payment_method) },
        { label: 'Total', value: formatCurrency(order.total) },
      ])}
      ${renderItemsSection(items)}
    `,
    ctaLabel: 'View Order →',
    ctaHref: orderUrl,
  });

  await sendSellerEmail({
    to: sellerEmail,
    subject,
    html,
  });

  return NextResponse.json({ success: true });
}

async function handlePaymentProofUploaded(payload: WebhookPayload) {
  const record = getWebhookRecord(payload);
  const previousRecord = getOldWebhookRecord(payload);
  const orderId = getString(record?.id);
  const paymentMethod = getString(record?.payment_method);
  const proofUrl = getString(record?.payment_proof_url);
  const previousProofUrl = getString(previousRecord?.payment_proof_url);

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order id.' }, { status: 400 });
  }

  if (paymentMethod !== 'instapay' || !proofUrl || previousProofUrl) {
    return NextResponse.json({ skipped: true, reason: 'Payment proof event does not match.' });
  }

  const { order, sellerEmail } = await getOrderNotificationContext(orderId);
  const customerName = order.address_name || 'A customer';
  const orderUrl = `${getAppUrl()}/en/orders/${order.id}`;
  const subject = `Payment proof uploaded — Order #${order.order_number}`;

  const html = renderEmail({
    preview: `${customerName} uploaded a payment proof for Order #${order.order_number}.`,
    title: 'Payment proof uploaded',
    intro: `${customerName} uploaded a payment proof for Order #${order.order_number}.`,
    sections: `
      ${renderSection('Order details', [
        { label: 'Order number', value: `#${order.order_number}` },
        { label: 'Customer', value: customerName },
        { label: 'Total', value: formatCurrency(order.total) },
      ])}
    `,
    ctaLabel: 'Review Proof →',
    ctaHref: orderUrl,
  });

  await sendSellerEmail({
    to: sellerEmail,
    subject,
    html,
  });

  return NextResponse.json({ success: true });
}

async function handleLowStock(payload: WebhookPayload) {
  const record = getWebhookRecord(payload);
  const previousRecord = getOldWebhookRecord(payload);
  const variantId = getString(record?.id);
  const currentStock = getNumber(record?.stock_qty);
  const threshold = getNumber(record?.low_stock_threshold);
  const previousStock = getNumber(previousRecord?.stock_qty);

  if (!variantId) {
    return NextResponse.json({ error: 'Missing variant id.' }, { status: 400 });
  }

  if (currentStock === null || threshold === null || currentStock <= 0 || currentStock > threshold) {
    return NextResponse.json({ skipped: true, reason: 'Variant is not in low stock range.' });
  }

  if (previousStock !== null && previousStock <= threshold && previousStock > 0) {
    return NextResponse.json({ skipped: true, reason: 'Low stock alert already active.' });
  }

  const { data: variant, error: variantError } = await supabaseAdmin
    .from('product_variants')
    .select('id, name, stock_qty, low_stock_threshold, product_id, products!inner(id, name, shop_id)')
    .eq('id', variantId)
    .single<LowStockVariant>();

  if (variantError || !variant) {
    throw new Error(variantError?.message ?? 'Variant not found.');
  }

  const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;

  if (!product) {
    throw new Error('Product not found for variant.');
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id, name, owner_id')
    .eq('id', product.shop_id)
    .single<ShopDetails>();

  if (shopError || !shop) {
    throw new Error(shopError?.message ?? 'Shop not found.');
  }

  const sellerEmail = await getSellerEmail(shop.owner_id);
  const productLabel = variant.name ? `${product.name} · ${variant.name}` : product.name;
  const productUrl = `${getAppUrl()}/en/products/${product.id}`;
  const subject = `Low stock alert: ${product.name}${variant.name ? ` ${variant.name}` : ''} — ${variant.stock_qty} left`;

  const html = renderEmail({
    preview: `${productLabel} is running low with ${variant.stock_qty} left.`,
    title: 'Low stock alert',
    intro: `${productLabel} has reached your low stock threshold.`,
    sections: `
      ${renderSection('Variant details', [
        { label: 'Product', value: productLabel },
        { label: 'Current stock', value: String(variant.stock_qty) },
        { label: 'Threshold', value: String(variant.low_stock_threshold) },
      ])}
    `,
    ctaLabel: 'Adjust Stock →',
    ctaHref: productUrl,
  });

  await sendSellerEmail({
    to: sellerEmail,
    subject,
    html,
  });

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const webhookSecret = request.headers.get('x-webhook-secret');

  if (!process.env.WEBHOOK_SECRET || webhookSecret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eventType = request.headers.get('x-event-type');

  if (!eventType) {
    return NextResponse.json({ error: 'Missing x-event-type header.' }, { status: 400 });
  }

  try {
    const payload = (await request.json()) as WebhookPayload;

    switch (eventType) {
      case 'order_submitted':
        return await handleOrderSubmitted(payload);
      case 'payment_proof_uploaded':
        return await handlePaymentProofUploaded(payload);
      case 'low_stock':
        return await handleLowStock(payload);
      default:
        return NextResponse.json({ error: 'Unsupported event type.' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
