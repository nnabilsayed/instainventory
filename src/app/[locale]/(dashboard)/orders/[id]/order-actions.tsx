'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatPhoneForWhatsApp } from '@/lib/phone';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { getOrderMessage } from '@/lib/whatsapp';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OrderActionsProps {
  orderId: string;
  status: string;
  orderNumber: number;
  addressName: string;
  checkoutToken: string | null;
  shop: {
    slug: string;
    whatsapp: string | null;
    autoWhatsappNotifications: boolean;
  };
}

export default function OrderActions({
  orderId,
  status,
  orderNumber,
  addressName,
  checkoutToken,
  shop,
}: OrderActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

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
    return true;
  }

  function getWhatsappUrl(nextStatus: 'confirmed' | 'shipped' | 'delivered') {
    if (!shop.autoWhatsappNotifications || !shop.whatsapp) {
      return null;
    }

    const trackingUrl = checkoutToken
      ? `${window.location.origin}/store/${shop.slug}/order/${checkoutToken}`
      : undefined;

    if (nextStatus === 'confirmed') {
      const message = encodeURIComponent(
        `Hi ${addressName}! âœ… Your order #${orderNumber} has been confirmed and is being prepared.\n\nTrack your order here: ${trackingUrl ?? ''}`,
      );
      return `https://wa.me/${formatPhoneForWhatsApp(shop.whatsapp)}?text=${message}`;
    }

    if (nextStatus === 'shipped') {
      const message = encodeURIComponent(
        `Hi ${addressName}! ðŸšš Your order #${orderNumber} is on its way!\n\nTrack your order here: ${trackingUrl ?? ''}`,
      );
      return `https://wa.me/${formatPhoneForWhatsApp(shop.whatsapp)}?text=${message}`;
    }

    const message = encodeURIComponent(
      getOrderMessage('delivered', {
        customerName: addressName,
        orderId,
        orderNumber,
        shopName: 'InstaInventory',
        shopSlug: shop.slug,
      }),
    );

    return `https://wa.me/${formatPhoneForWhatsApp(shop.whatsapp)}?text=${message}`;
  }

  async function handleStatusAction(nextStatus: 'confirmed' | 'shipped' | 'delivered') {
    const whatsappUrl = getWhatsappUrl(nextStatus);
    const popup = whatsappUrl ? window.open(whatsappUrl, '_blank') : null;
    const success = await updateStatus(nextStatus);

    if (!success && popup) {
      popup.close();
    }
  }

  if (status === 'pending') {
    return (
      <>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleStatusAction('confirmed')}
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
            onClick={() => void handleStatusAction('shipped')}
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
            onClick={() => void handleStatusAction('delivered')}
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
