import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { RevenueValue } from '@/components/dashboard/revenue-value';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type OrderStatus } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { getExpiryRelativeLabel, isOpenCheckoutStatus } from '@/lib/order-expiry';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { PackagePlus, Plus } from 'lucide-react';

export const revalidate = 0;

function getOrderExpiryMeta(status: string, expiresAt?: string | null) {
  if (!isOpenCheckoutStatus(status) || !expiresAt) return null;

  return getExpiryRelativeLabel(expiresAt);
}

function renderMetricCard({
  label,
  value,
  accent,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
  valueClassName?: string;
}) {
  return (
    <Card className={`border-s-4 ${accent}`}>
      <CardContent className="p-3">
        <p className="text-2xs font-medium uppercase tracking-widest text-secondary">{label}</p>
        <p className={`mt-2 text-2xl font-bold text-primary ${valueClassName ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('nav');
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: ordersToday },
    { data: revenueData },
    { data: lowStockCandidates },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .neq('status', 'draft')
      .neq('status', 'cancelled')
      .gte('created_at', today.toISOString()),
    supabase
      .from('orders')
      .select('total')
      .eq('shop_id', shop.id)
      .in('status', ['confirmed', 'shipped', 'delivered']),
    supabase
      .from('product_variants')
      .select(`
        id,
        name,
        size,
        color,
        stock_qty,
        low_stock_threshold,
        products!inner(
          id,
          name,
          shop_id
        )
      `)
      .eq('products.shop_id', shop.id),
    supabase
      .from('orders')
      .select('id, order_number, status, total, expires_at, customers(name)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const lowStockVariants = (lowStockCandidates ?? [])
    .filter((variant) => variant.low_stock_threshold > 0 && variant.stock_qty <= variant.low_stock_threshold)
    .sort((a, b) => a.stock_qty - b.stock_qty)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-primary">{t('dashboard')}</h1>
        <p className="text-sm text-secondary">Good morning 👋</p>
      </div>

      <div className="grid w-full grid-cols-3 items-start gap-3">
        {renderMetricCard({
          label: 'Active Orders',
          value: ordersToday || 0,
          accent: 'border-s-[#1D4ED8]',
        })}
        {renderMetricCard({
          label: 'Revenue',
          value: <RevenueValue value={totalRevenue} />,
          accent: 'border-s-[#15803D]',
        })}
        {renderMetricCard({
          label: 'Low Stock',
          value: lowStockVariants.length,
          accent: 'border-s-[#F59E0B]',
          valueClassName: lowStockVariants.length > 0 ? 'text-[var(--warning-text)]' : '',
        })}
      </div>

      {lowStockVariants.length > 0 ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] border-s-4 border-s-[var(--warning-text)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-sm font-semibold text-primary">
                Low stock - {lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's' : ''} need attention
              </span>
            </div>
            <Link href={`/${locale}/products`} className="text-xs font-medium text-[var(--accent-navy)] hover:underline">
              Manage products -&gt;
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {lowStockVariants.map((variant) => {
              const isOutOfStock = variant.stock_qty <= 0;
              const displayStock = Math.max(0, variant.stock_qty);
              const variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ') || variant.name;
              const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;

              return (
                <Link
                  key={variant.id}
                  href={`/${locale}/products/${product.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 flex-shrink-0 rounded-full',
                        isOutOfStock ? 'bg-[var(--danger-text)]' : 'bg-[var(--warning-text)]'
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">{product.name}</p>
                      <p className="truncate text-xs text-secondary">{variantLabel}</p>
                    </div>
                  </div>

                  <div className="ms-4 flex flex-shrink-0 items-center gap-3">
                    <div className="text-end">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isOutOfStock ? 'text-[var(--danger-text)]' : 'text-[var(--warning-text)]'
                        )}
                      >
                        {displayStock === 0 ? 'Out of stock' : `${displayStock} left`}
                      </p>
                      <p className="text-xs text-tertiary">Threshold: {variant.low_stock_threshold}</p>
                    </div>
                    <span className="text-xs text-tertiary">-&gt;</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {lowStockVariants.length === 10 ? (
            <div className="border-t border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2">
              <Link href={`/${locale}/products`} className="text-xs text-secondary hover:text-primary">
                View all low stock products -&gt;
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid w-full grid-cols-2 gap-3">
        <Button className="w-full" asChild>
          <Link href={`/${locale}/orders/new`}>
            <Plus size={16} />
            <span>New Order</span>
          </Link>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/${locale}/products/new`}>
            <PackagePlus size={16} />
            <span>Add Product</span>
          </Link>
        </Button>
      </div>

      <Card className="h-fit w-full">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium text-primary">Recent Orders</CardTitle>
          <Button variant="link" className="px-0 text-sm text-secondary" asChild>
            <Link href={`/${locale}/orders`} className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1">
              <span>View all</span>
              <span className="rtl:scale-x-[-1]">→</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-0">
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-4 py-8 text-center text-sm text-secondary">
              No orders yet. Start by creating a draft.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:hidden">
                {recentOrders.map((order) => {
                  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                  const cData = customer as { name?: string } | null;
                  const expiryMeta = getOrderExpiryMeta(order.status, order.expires_at);

                  return (
                    <Link
                      key={order.id}
                      href={`/${locale}/orders/${order.id}`}
                      className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">#{order.order_number}</span>
                          <StatusBadge status={order.status as OrderStatus} />
                        </div>
                        <p className="text-base font-medium text-primary">{cData?.name || 'Unknown customer'}</p>
                        {expiryMeta ? <p className="text-xs text-[var(--warning-text)]">{expiryMeta}</p> : null}
                      </div>
                      <p className="text-base font-semibold text-primary">{order.total} EGP</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <RecentOrdersTable locale={locale} recentOrders={recentOrders} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
