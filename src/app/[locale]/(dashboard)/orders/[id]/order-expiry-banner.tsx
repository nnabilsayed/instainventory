'use client';

import { CheckoutCountdown } from '@/components/checkout/checkout-countdown';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OrderExpiryBanner({
  orderId,
  expiresAt,
}: {
  orderId: string;
  expiresAt: string;
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleExtendLink() {
    setLoading(true);

    await supabase
      .from('orders')
      .update({
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', orderId);

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <CheckoutCountdown expiresAt={expiresAt} />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExtendLink}
          disabled={loading}
          className="text-xs text-[var(--accent-navy)] underline disabled:opacity-60"
        >
          Extend 24h
        </button>
      </div>
    </div>
  );
}
