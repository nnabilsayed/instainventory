'use client';

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type OrderRow = {
  id: string;
  shop_id: string;
  status: string;
};

type OrderPayload = RealtimePostgresChangesPayload<OrderRow>;
type OrderListener = (payload: OrderPayload) => void | Promise<void>;

type OrderStore = {
  supabase: ReturnType<typeof createClient>;
  channel: RealtimeChannel | null;
  listeners: Set<OrderListener>;
  refCount: number;
};

const dashboardOrderStores = new Map<string, OrderStore>();

function getStore(shopId: string) {
  let store = dashboardOrderStores.get(shopId);

  if (!store) {
    store = {
      supabase: createClient(),
      channel: null,
      listeners: new Set(),
      refCount: 0,
    };

    dashboardOrderStores.set(shopId, store);
  }

  return store;
}

function ensureChannel(shopId: string, store: OrderStore) {
  if (store.channel) return;

  store.channel = store.supabase
    .channel(`dashboard-orders:${shopId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `shop_id=eq.${shopId}`,
      },
      (payload) => {
        store.listeners.forEach((listener) => {
          void listener(payload as OrderPayload);
        });
      },
    )
    .subscribe();
}

export function subscribeToDashboardOrders(shopId: string, listener: OrderListener) {
  const store = getStore(shopId);

  store.listeners.add(listener);
  store.refCount += 1;
  ensureChannel(shopId, store);

  return () => {
    store.listeners.delete(listener);
    store.refCount = Math.max(0, store.refCount - 1);

    if (store.refCount === 0) {
      if (store.channel) {
        void store.supabase.removeChannel(store.channel);
      }

      dashboardOrderStores.delete(shopId);
    }
  };
}
