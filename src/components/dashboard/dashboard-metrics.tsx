'use client';

import { subscribeToDashboardOrders } from '@/components/dashboard/dashboard-orders-realtime';
import type { DashboardMetricsState } from '@/components/dashboard/dashboard-types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

function formatEGP(value: number) {
  return `${new Intl.NumberFormat('en-US').format(value)} EGP`;
}

function isActiveOrderStatus(status: string | null | undefined) {
  return status === 'pending' || status === 'confirmed' || status === 'shipped';
}

function renderMetricCard({
  label,
  value,
  accent,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  accent: string;
  valueClassName?: string;
}) {
  return (
    <Card className={`h-full border-s-4 ${accent}`}>
      <CardContent className="flex h-full flex-col p-3">
        <p className="text-2xs font-medium uppercase tracking-widest text-secondary">{label}</p>
        <div className={`mt-2 text-2xl font-bold text-primary ${valueClassName ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardMetrics({
  initialMetrics,
  shopId,
}: {
  initialMetrics: DashboardMetricsState;
  shopId: string;
}) {
  const [metrics, setMetrics] = useState(initialMetrics);

  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  useEffect(() => {
    return subscribeToDashboardOrders(shopId, (payload) => {
      if (payload.eventType === 'INSERT' && isActiveOrderStatus(payload.new.status)) {
        setMetrics((prev) => ({ ...prev, activeOrders: prev.activeOrders + 1 }));
        return;
      }

      if (payload.eventType === 'UPDATE') {
        const previousStatus = payload.old?.status;
        const wasActive = isActiveOrderStatus(previousStatus);
        const isActive = isActiveOrderStatus(payload.new.status);

        if (previousStatus == null) {
          if (!isActive) {
            setMetrics((prev) => ({
              ...prev,
              activeOrders: Math.max(0, prev.activeOrders - 1),
            }));
          }

          return;
        }

        if (wasActive === isActive) return;

        setMetrics((prev) => ({
          ...prev,
          activeOrders: Math.max(0, prev.activeOrders + (isActive ? 1 : -1)),
        }));
      }
    });
  }, [shopId]);

  return (
    <div className="grid w-full grid-cols-3 gap-3">
      {renderMetricCard({
        label: 'Active Orders',
        value: metrics.activeOrders,
        accent: 'border-s-[#1D4ED8]',
      })}
      {renderMetricCard({
        label: 'Revenue',
        value: (
          <>
            <span>{formatEGP(metrics.revenue)}</span>
            <p
              className={cn(
                'mt-2 text-xs font-medium',
                metrics.revenueChange === null
                  ? 'text-secondary'
                  : Number(metrics.revenueChange) >= 0
                    ? 'text-[var(--success-text)]'
                    : 'text-[var(--danger-text)]',
              )}
            >
              {metrics.revenueChange === null
                ? 'No last week comparison'
                : `${Number(metrics.revenueChange) >= 0 ? '+' : '-'} ${Math.abs(Number(metrics.revenueChange))}% vs last week`}
            </p>
            <p className="mt-1 text-xs font-normal text-secondary">{metrics.revenueOrderCount} orders this week</p>
          </>
        ),
        accent: 'border-s-[#15803D]',
      })}
      {renderMetricCard({
        label: 'Low Stock',
        value: metrics.lowStock,
        accent: 'border-s-[#F59E0B]',
        valueClassName: metrics.lowStock > 0 ? 'text-[var(--warning-text)]' : '',
      })}
    </div>
  );
}
