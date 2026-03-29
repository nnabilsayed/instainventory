'use client';

import { StatusBadge, type OrderStatus } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getRowHref(locale: string, orderId: string) {
  return `/${locale}/orders/${orderId}`;
}

export function RecentOrdersTable({
  locale,
  recentOrders,
  highlightedOrderId,
}: {
  locale: string;
  recentOrders: Array<{
    id: string;
    order_number: string | number;
    status: string;
    total: string | number;
    expires_at?: string | null;
    customers?: { name?: string } | { name?: string }[] | null;
  }>;
  highlightedOrderId?: string | null;
}) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="w-[44px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentOrders.map((order) => {
          const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
          const customerData = customer as { name?: string } | null;
          const href = getRowHref(locale, order.id);

          return (
            <TableRow
              key={order.id}
              onClick={() => router.push(href)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(href);
                }
              }}
              tabIndex={0}
              className={cn(
                'cursor-pointer hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-navy)]',
                highlightedOrderId === order.id && 'order-row-flash',
              )}
            >
              <TableCell className="text-base font-semibold text-primary">#{order.order_number}</TableCell>
              <TableCell className="text-base font-medium text-primary">
                {customerData?.name || 'Unknown customer'}
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status as OrderStatus} />
              </TableCell>
              <TableCell className="text-base font-semibold text-primary">{order.total} EGP</TableCell>
              <TableCell className="text-end text-[var(--text-tertiary)]">
                <ChevronRight size={16} aria-hidden="true" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
