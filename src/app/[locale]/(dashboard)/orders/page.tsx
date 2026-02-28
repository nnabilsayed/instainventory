import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

export const revalidate = 0;

export default async function OrdersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string },
  searchParams: { status?: string }
}) {
  const supabase = createClient();
  const t = await getTranslations('orders');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const statusFilter = searchParams.status || 'all';

  let query = supabase
    .from('orders')
    .select(`id, order_number, status, total, created_at, payment_method, customers ( name, phone )`)
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: orders } = await query;

  const statuses = ['all', 'draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string; className?: string }> = {
      draft:     { variant: 'secondary',   label: 'Draft' },
      pending:   { variant: 'outline',     label: 'Pending',   className: 'text-orange-600 border-orange-200 bg-orange-50' },
      confirmed: { variant: 'outline',     label: 'Confirmed', className: 'text-blue-600 border-blue-200 bg-blue-50' },
      shipped:   { variant: 'outline',     label: 'Shipped',   className: 'text-purple-600 border-purple-200 bg-purple-50' },
      delivered: { variant: 'outline',     label: 'Delivered', className: 'text-green-600 border-green-200 bg-green-50' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const cfg = map[status] || { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('orders') || 'Orders'}</h1>
        <Button asChild>
          <Link href={`/${locale}/orders/new`}>{t('newOrder') || '+ New Order'}</Link>
        </Button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            className="capitalize whitespace-nowrap rounded-full"
            asChild
          >
            <Link href={`/${locale}/orders?status=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No orders found for this status.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const customerInfo = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                  const customer = (customerInfo as any) || { name: 'Unknown', phone: 'Unknown' };
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.order_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                      </TableCell>
                      <TableCell>{statusBadge(order.status)}</TableCell>
                      <TableCell className="font-mono">
                        {order.total} EGP
                        {order.payment_method && (
                          <div className="text-xs text-muted-foreground capitalize">{order.payment_method}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/${locale}/orders/${order.id}`}>View →</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
