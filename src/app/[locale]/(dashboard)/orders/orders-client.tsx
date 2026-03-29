'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatPhoneDisplay } from '@/lib/phone';
import { notify } from '@/lib/toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { Check, Copy, Download, Package, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Customer = {
  name?: string;
  phone?: string;
};

type Order = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  source?: string | null;
  payment_method: string | null;
  created_at: string;
  expires_at?: string | null;
  checkout_token: string | null;
  customers: Customer | Customer[] | null;
};

const STATUS_FILTERS = ['all', 'draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

function getCustomer(order: Order) {
  return Array.isArray(order.customers) ? (order.customers[0] ?? null) : order.customers;
}

function getPaymentMethodLabel(method: string | null) {
  if (method === 'cod') return 'Cash';
  if (method === 'instapay') return 'InstaPay';
  return '';
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;

  return (
    <span>
      {text.slice(0, idx)}
      <mark className="rounded bg-[var(--warning-bg)] px-0.5 font-medium not-italic text-[var(--warning-text)]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export function OrdersClient({
  orders,
  locale,
  shopId,
  shopSlug,
}: {
  orders: Order[];
  locale: string;
  shopId: string;
  shopSlug: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [orderList, setOrderList] = useState(orders);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedOrderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const selectableStatuses = ['confirmed', 'shipped'];

  useEffect(() => {
    setOrderList(orders);
  }, [orders]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      if (copiedOrderTimeoutRef.current) {
        clearTimeout(copiedOrderTimeoutRef.current);
      }
    };
  }, []);

  const counts = useMemo(
    () =>
      STATUS_FILTERS.reduce(
        (acc, status) => {
          acc[status] =
            status === 'all' ? orderList.length : orderList.filter((order) => order.status === status).length;
          return acc;
        },
        {} as Record<(typeof STATUS_FILTERS)[number], number>,
      ),
    [orderList],
  );

  const filtered = useMemo(() => {
    let result = orderList;

    if (activeStatus !== 'all') {
      result = result.filter((order) => order.status === activeStatus);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((order) => {
        const customer = getCustomer(order);
        const name = customer?.name?.toLowerCase() ?? '';
        const phone = customer?.phone ?? '';
        const orderNum = String(order.order_number);
        const orderNumWithHash = `#${order.order_number}`;

        return (
          name.includes(q) ||
          phone.includes(q) ||
          orderNum.includes(q) ||
          orderNumWithHash.includes(q)
        );
      });
    }

    return result;
  }, [orderList, search, activeStatus]);

  useEffect(() => {
    const channel = supabase
      .channel(`orders-list-${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newOrder } = await supabase
              .from('orders')
              .select(
                'id, order_number, status, total, payment_method, created_at, expires_at, checkout_token, source, customers(name, phone)',
              )
              .eq('id', payload.new.id)
              .single();

            if (!newOrder) return;

            setOrderList((prev) => [newOrder, ...prev.filter((order) => order.id !== newOrder.id)]);
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
            setOrderList((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? {
                      ...order,
                      status: payload.new.status ?? order.status,
                    }
                  : order,
              ),
            );
            return;
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;

            setOrderList((prev) => prev.filter((order) => order.id !== deletedId));
            setSelectedIds((prev) => {
              if (!prev.has(deletedId)) return prev;

              const next = new Set(prev);
              next.delete(deletedId);
              return next;
            });

            setHighlightedOrderId((current) => (current === deletedId ? null : current));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [shopId, supabase]);

  const selectedOrders = filtered.filter((order) => selectedIds.has(order.id));
  const selectedStatus = selectedOrders[0]?.status ?? null;
  const bulkAction =
    selectedStatus === 'confirmed'
      ? { label: 'Mark as Shipped', newStatus: 'shipped' }
      : selectedStatus === 'shipped'
        ? { label: 'Mark as Delivered', newStatus: 'delivered' }
        : null;

  function isSelectable(order: Order): boolean {
    if (!selectableStatuses.includes(order.status)) return false;
    if (selectedIds.size > 0 && order.status !== selectedStatus) return false;
    return true;
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const selectableFiltered = filtered.filter(isSelectable);
    const allSelected = selectableFiltered.every((order) => selectedIds.has(order.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableFiltered.map((order) => order.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleStatusChange(status: (typeof STATUS_FILTERS)[number]) {
    setActiveStatus(status);
    setSelectedIds(new Set());
  }

  async function handleCopyCheckoutLink(
    event: MouseEvent<HTMLButtonElement>,
    order: Order,
  ) {
    event.stopPropagation();

    if (!order.checkout_token) return;

    const checkoutUrl = `${window.location.origin}/store/${shopSlug}/checkout/${order.checkout_token}`;

    await navigator.clipboard.writeText(checkoutUrl);
    notify.linkCopied();
    setCopiedOrderId(order.id);

    if (copiedOrderTimeoutRef.current) {
      clearTimeout(copiedOrderTimeoutRef.current);
    }

    copiedOrderTimeoutRef.current = window.setTimeout(() => {
      setCopiedOrderId((current) => (current === order.id ? null : current));
    }, 2000);
  }

  async function handleBulkUpdate() {
    if (!bulkAction || selectedIds.size === 0) return;
    setBulkLoading(true);

    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('orders')
      .update({ status: bulkAction.newStatus })
      .in('id', ids);

    if (error) {
      notify.error(`Failed to update orders - ${error.message}`);
    } else {
      notify.success(
        `${ids.length} order${ids.length > 1 ? 's' : ''} marked as ${bulkAction.newStatus}`
      );
      setSelectedIds(new Set());
      router.refresh();
    }

    setBulkLoading(false);
  }

  async function handleExport() {
    try {
      setExporting(true);
      const res = await fetch('/api/exports/orders');

      if (!res.ok) {
        throw new Error('Failed to export orders');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);

      a.href = url;
      a.download = filenameMatch?.[1] ?? 'orders.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to export orders');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-primary">Orders</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="w-full justify-center sm:w-auto"
          >
            <Download size={15} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Link
            href={`/${locale}/orders/new`}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] sm:min-h-[40px]"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Order</span>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by customer name, phone, or order #..."
          className="w-full min-h-[44px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] pe-9 ps-9 text-sm text-primary placeholder:text-tertiary transition-colors focus:border-[var(--accent-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] transition-colors hover:text-primary"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusChange(status)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              activeStatus === status
                ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                : 'border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
            )}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' ? <span className="ms-1.5 text-xs opacity-60">{counts[status]}</span> : null}
          </button>
        ))}
      </div>

      {search ? (
        <p className="text-xs text-secondary">
          {filtered.length === 0
            ? `No orders found for "${search}"`
            : `${filtered.length} order${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      ) : null}

      {selectedIds.size > 0 && bulkAction ? (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--accent-navy)] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedIds.size} order{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-white/60 underline transition-colors hover:text-white"
            >
              Clear
            </button>
          </div>

          <button
            type="button"
            onClick={() => setConfirmBulkOpen(true)}
            disabled={bulkLoading}
            className="flex min-h-[36px] flex-shrink-0 items-center gap-2 rounded-[var(--radius-md)] bg-white px-4 text-sm font-semibold text-[var(--accent-navy)] transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {bulkLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-navy)]/30 border-t-[var(--accent-navy)]" />
                Updating...
              </>
            ) : (
              <>
                <Package size={14} />
                {bulkAction.label}
              </>
            )}
          </button>
        </div>
      ) : null}

      {(activeStatus === 'confirmed' || activeStatus === 'shipped') && filtered.length > 0 ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2">
          <input
            type="checkbox"
            checked={
              filtered.filter(isSelectable).length > 0 &&
              filtered.filter(isSelectable).every((order) => selectedIds.has(order.id))
            }
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer rounded accent-[var(--accent-navy)]"
          />
          <span className="text-xs text-secondary">
            Select all {filtered.filter(isSelectable).length} {activeStatus} orders
          </span>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="space-y-2 py-16 text-center">
          <div className="text-4xl">{search ? '🔍' : '📦'}</div>
          <p className="text-sm font-medium text-primary">
            {search ? 'No orders match your search' : 'No orders yet'}
          </p>
          <p className="text-xs text-secondary">
            {search ? 'Try searching by a different name or phone number' : 'Create your first order to get started'}
          </p>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-2 text-xs text-[var(--accent-navy)] underline"
            >
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const customer = getCustomer(order);
            const customerName = customer?.name ?? 'Unknown customer';
            const customerPhone = customer?.phone ?? '';
            const displayPhone = customerPhone ? formatPhoneDisplay(customerPhone) : 'No phone';
            const paymentMethodLabel = getPaymentMethodLabel(order.payment_method);
            const canCopyCheckoutLink =
              (order.status === 'draft' || order.status === 'pending') && Boolean(order.checkout_token);

            return (
              <div
                key={order.id}
                className={cn(
                  'flex items-start gap-3 rounded-[var(--radius-lg)] border bg-[var(--surface)] px-4 py-3 transition-colors',
                  highlightedOrderId === order.id && 'order-row-flash',
                  selectedIds.has(order.id)
                    ? 'border-[var(--accent-navy)] bg-[var(--info-bg)]'
                    : 'border-[var(--border)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {isSelectable(order) ? (
                  <div
                    className="mt-0.5 flex-shrink-0"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleSelect(order.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="h-4 w-4 cursor-pointer rounded accent-[var(--accent-navy)]"
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                ) : (
                  <div className="w-4 flex-shrink-0" />
                )}

                <Link
                  href={`/${locale}/orders/${order.id}`}
                  className="min-w-0 flex-1"
                  onClick={(event) => {
                    if (isSelectable(order) && selectedIds.size > 0) {
                      event.preventDefault();
                      toggleSelect(order.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-primary">#{order.order_number}</span>
                        {order.source === 'self_checkout' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: 'var(--info-bg)',
                              color: 'var(--info-text)',
                              marginInlineStart: '6px',
                            }}
                          >
                            Self-checkout
                          </span>
                        ) : null}
                        <StatusBadge status={order.status as any} />
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-primary">{highlight(customerName, search)}</p>
                      <p className="truncate text-xs text-secondary">{highlight(displayPhone, search)}</p>
                      <p className="mt-1 text-xs text-tertiary">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-end">
                      <p className="text-sm font-semibold text-primary">{order.total.toLocaleString()} EGP</p>
                      {paymentMethodLabel ? (
                        <span className="mt-1 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-0.5 text-2xs font-medium text-secondary">
                          {paymentMethodLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>

                <div className="flex min-h-[44px] w-11 flex-shrink-0 items-center justify-center self-center">
                  {canCopyCheckoutLink ? (
                    <button
                      type="button"
                      onClick={(event) => void handleCopyCheckoutLink(event, order)}
                      aria-label="Copy checkout link"
                      className={cn(
                        'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-[6px] transition-colors hover:bg-[var(--surface-hover)]',
                        copiedOrderId === order.id
                          ? 'text-[var(--success-text)]'
                          : 'text-[var(--text-tertiary)]',
                      )}
                    >
                      {copiedOrderId === order.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmBulkOpen}
        title={`${bulkAction?.label}?`}
        message={`This will update ${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''} to ${bulkAction?.newStatus}. This cannot be undone.`}
        confirmLabel={bulkAction?.label ?? 'Confirm'}
        cancelLabel="Cancel"
        variant="warning"
        loading={bulkLoading}
        onConfirm={() => {
          setConfirmBulkOpen(false);
          void handleBulkUpdate();
        }}
        onCancel={() => setConfirmBulkOpen(false)}
      />
    </div>
  );
}
