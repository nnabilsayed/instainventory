import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type ExportOrderItem = {
  product_name: string | null;
  variant_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
};

type ExportCustomer = {
  name: string | null;
  phone: string | null;
  instagram: string | null;
};

type ExportOrder = {
  id: string;
  order_number: number;
  status: string;
  payment_method: string | null;
  subtotal: number | null;
  discount_amount: number | null;
  shipping_fee: number | null;
  total: number | null;
  notes: string | null;
  created_at: string;
  pending_at: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  address_name: string | null;
  address_phone: string | null;
  address_city: string | null;
  address_area: string | null;
  address_street: string | null;
  customers: ExportCustomer | ExportCustomer[] | null;
  order_items: ExportOrderItem[] | null;
};

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';

  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}

function getCustomer(order: ExportOrder): ExportCustomer | null {
  return Array.isArray(order.customers) ? (order.customers[0] ?? null) : order.customers;
}

function formatPaymentMethod(method: string | null): string {
  if (method === 'cod') return 'COD';
  if (method === 'instapay') return 'InstaPay';
  return method ?? '';
}

function formatStatus(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
}

function formatItems(items: ExportOrderItem[] | null): string {
  if (!items?.length) return '';

  return items
    .map((item) => {
      const name = [item.product_name, item.variant_name].filter(Boolean).join(' ').trim();
      const quantity = item.quantity ?? 0;
      return `${name} \u00D7 ${quantity}`.trim();
    })
    .join(', ');
}

function parseFromDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return `${value}T00:00:00.000Z`;
}

function parseToDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return `${value}T23:59:59.999Z`;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, currency')
    .eq('owner_id', user.id)
    .single();

  if (!shop) {
    return new Response('Shop not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      payment_method,
      subtotal,
      discount_amount,
      shipping_fee,
      total,
      notes,
      created_at,
      pending_at,
      confirmed_at,
      shipped_at,
      delivered_at,
      cancelled_at,
      address_name,
      address_phone,
      address_city,
      address_area,
      address_street,
      customers (name, phone, instagram),
      order_items (
        product_name,
        variant_name,
        quantity,
        unit_price,
        line_total
      )
    `)
    .eq('shop_id', shop.id)
    .order('order_number', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (from) {
    const fromDate = parseFromDate(from);
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
  }

  if (to) {
    const toDate = parseToDate(to);
    if (toDate) {
      query = query.lte('created_at', toDate);
    }
  }

  const { data: orders } = await query;

  const rows = [
    [
      'Order #',
      'Status',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Customer Instagram',
      'City',
      'Area',
      'Street Address',
      'Payment Method',
      'Items',
      'Subtotal (EGP)',
      'Discount (EGP)',
      'Shipping (EGP)',
      'Total (EGP)',
      'Notes',
      'Pending At',
      'Confirmed At',
      'Shipped At',
      'Delivered At',
      'Cancelled At',
    ].map(escapeCSV).join(','),
  ];

  for (const order of (orders ?? []) as ExportOrder[]) {
    const customer = getCustomer(order);
    rows.push(
      [
        order.order_number,
        formatStatus(order.status),
        formatDateTime(order.created_at),
        customer?.name ?? order.address_name ?? '',
        customer?.phone ?? order.address_phone ?? '',
        customer?.instagram ?? '',
        order.address_city ?? '',
        order.address_area ?? '',
        order.address_street ?? '',
        formatPaymentMethod(order.payment_method),
        formatItems(order.order_items),
        order.subtotal ?? '',
        order.discount_amount ?? '',
        order.shipping_fee ?? '',
        order.total ?? '',
        order.notes ?? '',
        formatDateTime(order.pending_at),
        formatDateTime(order.confirmed_at),
        formatDateTime(order.shipped_at),
        formatDateTime(order.delivered_at),
        formatDateTime(order.cancelled_at),
      ]
        .map(escapeCSV)
        .join(',')
    );
  }

  const BOM = '\uFEFF';
  const csvContent = BOM + rows.join('\n');
  const filename = `orders-${shop.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
