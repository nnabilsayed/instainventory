import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPhoneDisplay } from '@/lib/phone';
import { StatusBadge, type OrderStatus } from '@/components/ui/status-badge';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

function getCustomerInitial(name: string | null) {
  return (name?.[0] || 'C').toUpperCase();
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return format(date, 'MMM d');
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, orders ( id, order_number, status, total, created_at, order_items ( product_name, variant_name, quantity, unit_price ) )')
    .eq('id', params.id)
    .eq('shop_id', shop.id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const orders = Array.isArray(customer.orders) ? customer.orders : [];
  const totalSpent = orders
    .filter((order: any) => order.status !== 'cancelled')
    .reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  const sortedOrders = orders
    .slice()
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link
        href={`/${params.locale}/customers`}
        className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 text-sm text-secondary hover:text-primary"
      >
        <span className="rtl:scale-x-[-1]">
          <ArrowLeft size={16} />
        </span>
        <span>Customers</span>
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-hover)] text-base font-semibold text-[var(--accent-navy)]">
              {getCustomerInitial(customer.name)}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-primary">{customer.name || 'Customer'}</h1>
              <p className="text-sm text-secondary">{customer.phone ? formatPhoneDisplay(customer.phone) : 'No phone number'}</p>
              {customer.instagram ? (
                <p className="text-sm text-secondary">@{String(customer.instagram).replace('@', '')}</p>
              ) : null}
              <p className="text-xs text-tertiary">
                Added {format(new Date(customer.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <Badge className="w-fit bg-[var(--accent-navy)] text-white">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-2xl font-bold text-primary">{orders.length}</p>
          <p className="mt-1 text-2xs uppercase tracking-widest text-secondary">Orders</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-2xl font-bold text-primary">{totalSpent.toFixed(0)} EGP</p>
          <p className="mt-1 text-2xs uppercase tracking-widest text-secondary">Spent</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-sm font-semibold text-primary">
            {sortedOrders[0] ? formatRelativeDate(sortedOrders[0].created_at) : '—'}
          </p>
          <p className="mt-1 text-2xs uppercase tracking-widest text-secondary">Last Order</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-primary">Order History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/${params.locale}/orders/${order.id}`}
                  className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-primary">#{order.order_number}</span>
                      <StatusBadge status={order.status as OrderStatus} />
                    </div>
                    <p className="text-sm text-secondary">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </p>
                    {Array.isArray(order.order_items) && order.order_items.length > 0 ? (
                      <p className="mt-1 text-xs text-secondary">
                        {order.order_items.length === 1
                          ? `${order.order_items[0].product_name} · ${order.order_items[0].variant_name} · qty ${order.order_items[0].quantity}`
                          : `${order.order_items[0].product_name} + ${order.order_items.length - 1} more item${order.order_items.length > 2 ? 's' : ''}`}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-base font-semibold text-primary">{order.total} EGP</p>
                </Link>
              ))
          ) : (
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-4 py-8 text-center text-sm text-secondary">
              No orders for this customer yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
