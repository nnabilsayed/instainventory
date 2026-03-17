'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OrderActionsProps {
  orderId: string;
  status: string;
}

export default function OrderActions({ orderId, status }: OrderActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      notify.orderError();
      setLoading(false);
      return;
    }

    if (newStatus === 'confirmed') notify.orderConfirmed();
    if (newStatus === 'shipped') notify.orderShipped();
    if (newStatus === 'delivered') notify.orderDelivered();
    if (newStatus === 'cancelled') notify.orderCancelled();

    setConfirmCancelOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (status === 'pending') {
    return (
      <>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateStatus('confirmed')}
            disabled={loading}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm Order'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmCancelOpen(true)}
            disabled={loading}
            className="min-h-[48px] rounded-[var(--radius-md)] bg-[var(--danger-bg)] px-5 text-sm font-medium text-[var(--danger-text)] transition-colors hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
        <ConfirmDialog
          open={confirmCancelOpen}
          title="Cancel this order?"
          message="This will cancel the order and restore stock back to inventory. This cannot be undone."
          confirmLabel="Yes, cancel order"
          cancelLabel="Keep order"
          variant="danger"
          loading={loading}
          onConfirm={() => updateStatus('cancelled')}
          onCancel={() => setConfirmCancelOpen(false)}
        />
      </>
    );
  }

  if (status === 'confirmed') {
    return (
      <>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateStatus('shipped')}
            disabled={loading}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Mark Shipped'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmCancelOpen(true)}
            disabled={loading}
            className="min-h-[48px] rounded-[var(--radius-md)] bg-[var(--danger-bg)] px-5 text-sm font-medium text-[var(--danger-text)] transition-colors hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
        <ConfirmDialog
          open={confirmCancelOpen}
          title="Cancel this order?"
          message="This will cancel the order and restore stock back to inventory. This cannot be undone."
          confirmLabel="Yes, cancel order"
          cancelLabel="Keep order"
          variant="danger"
          loading={loading}
          onConfirm={() => updateStatus('cancelled')}
          onCancel={() => setConfirmCancelOpen(false)}
        />
      </>
    );
  }

  if (status === 'shipped') {
    return (
      <>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateStatus('delivered')}
            disabled={loading}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Mark Delivered'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmCancelOpen(true)}
            disabled={loading}
            className="min-h-[48px] rounded-[var(--radius-md)] bg-[var(--danger-bg)] px-5 text-sm font-medium text-[var(--danger-text)] transition-colors hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
        <ConfirmDialog
          open={confirmCancelOpen}
          title="Cancel this order?"
          message="Stock will be restored to inventory. This cannot be undone."
          confirmLabel="Yes, cancel order"
          cancelLabel="Keep order"
          variant="danger"
          loading={loading}
          onConfirm={() => updateStatus('cancelled')}
          onCancel={() => setConfirmCancelOpen(false)}
        />
      </>
    );
  }

  if (status === 'draft') {
    return null;
  }

  return null;
}
