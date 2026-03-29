import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export const revalidate = 0;

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('nav');
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase
    .from('shops')
    .select('id, slug, self_checkout_enabled')
    .eq('owner_id', user.id)
    .single();
  if (!shop) return <div>Shop not found</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: ordersToday } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .neq('status', 'draft')
    .neq('status', 'cancelled')
    .gte('created_at', today.toISOString());

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total')
    .eq('shop_id', shop.id)
    .in('status', ['confirmed', 'shipped', 'delivered']);

  const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

  const { data: allVariants } = await supabase.from('product_variants').select('stock_qty, low_stock_threshold');
  const actualLowStockCount = allVariants?.filter(v => v.stock_qty <= v.low_stock_threshold).length || 0;

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at, source, customers(name)')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const statusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      draft:     { variant: 'secondary', label: 'Draft' },
      pending:   { variant: 'outline',   label: 'Pending',   className: 'text-orange-600 border-orange-200 bg-orange-50' },
      confirmed: { variant: 'outline',   label: 'Confirmed', className: 'text-blue-600 border-blue-200 bg-blue-50' },
      shipped:   { variant: 'outline',   label: 'Shipped',   className: 'text-purple-600 border-purple-200 bg-purple-50' },
      delivered: { variant: 'outline',   label: 'Delivered', className: 'text-green-600 border-green-200 bg-green-50' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const cfg = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('dashboard')}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ordersToday || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Revenue (EGP)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{actualLowStockCount}</p>
          </CardContent>
        </Card>
      </div>

      {shop?.self_checkout_enabled && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-text)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--success-text)', marginBottom: '8px' }}>
            Your store is live
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {process.env.NEXT_PUBLIC_APP_URL}/store/{shop.slug}
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="link" asChild>
            <Link href={`/${locale}/orders`}>View All →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No orders yet. Start by creating a draft!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(order => {
                  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                  const cData = customer as any;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/${locale}/orders/${order.id}`} className="hover:underline">#{order.order_number}</Link>
                        {order.source === 'self_checkout' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 600,
                            background: 'var(--info-bg)',
                            color: 'var(--info-text)',
                            marginInlineStart: '6px',
                          }}>
                            Self-checkout
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{cData?.name || 'Unknown'}</TableCell>
                      <TableCell>{statusBadge(order.status)}</TableCell>
                      <TableCell className="text-right font-mono">{order.total} EGP</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
