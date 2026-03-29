'use client';

import { subscribeToDashboardOrders } from '@/components/dashboard/dashboard-orders-realtime';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import type { DashboardRecentOrder } from '@/components/dashboard/dashboard-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type OrderStatus } from '@/components/ui/status-badge';
import { getExpiryRelativeLabel, isOpenCheckoutStatus } from '@/lib/order-expiry';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

function getOrderExpiryMeta(status: string, expiresAt?: string | null) {
  if (!isOpenCheckoutStatus(status) || !expiresAt) return null;

  return getExpiryRelativeLabel(expiresAt);
}

export function RecentOrdersRealtime({
  initialOrders,
  locale,
  shopId,
}: {
  initialOrders: DashboardRecentOrder[];
  locale: string;
  shopId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState(initialOrders);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return subscribeToDashboardOrders(shopId, async (payload) => {
      if (payload.eventType === 'INSERT') {
        const { data: newOrder } = await supabase
          .from('orders')
          .select('id, order_number, status, total, created_at, expires_at, customers(name)')
          .eq('id', payload.new.id)
          .single();

        if (!newOrder) return;

        setOrders((prev) => [newOrder, ...prev.filter((order) => order.id !== newOrder.id)].slice(0, 5));
        setHighlightedOrderId(newOrder.id);

        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }

        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedOrderId((current) => (current === newOrder.id ? null : current));
        }, 2000);

        notify.success(`New order #${newOrder.order_number} received!`);
        return;
      }

      if (payload.eventType === 'UPDATE') {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === payload.new.id
              ? {
                  ...order,
                  status: payload.new.status ?? order.status,
                }
              : order,
          ),
        );
      }
    });
  }, [shopId, supabase]);

  return (
    <Card className="h-fit w-full">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium text-primary">Recent Orders</CardTitle>
        <Button variant="link" className="px-0 text-sm text-secondary" asChild>
          <Link href={`/${locale}/orders`} className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1">
            <span>View all</span>
            <span className="rtl:scale-x-[-1]">-&gt;</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-0">
        {orders.length === 0 ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-4 py-8 text-center text-sm text-secondary">
            No orders yet. Start by creating a draft.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {orders.map((order) => {
                const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                const customerData = customer as { name?: string } | null;
                const expiryMeta = getOrderExpiryMeta(order.status, order.expires_at);

                return (
                  <Link
                    key={order.id}
                    href={`/${locale}/orders/${order.id}`}
                    className={cn(
                      'cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)]',
                      highlightedOrderId === order.id && 'order-row-flash',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">#{order.order_number}</span>
                          <StatusBadge status={order.status as OrderStatus} />
                        </div>
                        <p className="text-base font-medium text-primary">{customerData?.name || 'Unknown customer'}</p>
                        {expiryMeta ? <p className="text-xs text-[var(--warning-text)]">{expiryMeta}</p> : null}
                      </div>
                      <p className="text-base font-semibold text-primary">{order.total} EGP</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:block">
              <RecentOrdersTable
                locale={locale}
                recentOrders={orders}
                highlightedOrderId={highlightedOrderId}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
