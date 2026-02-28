'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function OrderActions({
  orderId, currentStatus, paymentMethod
}: {
  orderId: string;
  currentStatus: string;
  paymentMethod?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    setLoading(true);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert(error.message);
    else router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1 bg-background border rounded-md shadow-sm overflow-hidden text-sm font-medium">
      {currentStatus === 'draft' && (
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('pending')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-none">
            Send Link
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('cancelled')} className="text-destructive hover:text-destructive hover:bg-red-50 rounded-none">
            Cancel
          </Button>
        </>
      )}

      {currentStatus === 'pending' && (
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('confirmed')} className="text-green-700 hover:text-green-800 hover:bg-green-50 rounded-none font-semibold">
            {paymentMethod === 'instapay' ? 'Confirm Receipt' : 'Confirm Order'}
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('cancelled')} className="text-destructive hover:text-destructive hover:bg-red-50 rounded-none">
            Cancel Order
          </Button>
        </>
      )}

      {currentStatus === 'confirmed' && (
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('shipped')} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-none">
            Mark Shipped
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('cancelled')} className="text-destructive hover:text-destructive hover:bg-red-50 rounded-none">
            Cancel
          </Button>
        </>
      )}

      {currentStatus === 'shipped' && (
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('delivered')} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-none">
            Mark Delivered
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => updateStatus('cancelled')} className="text-destructive hover:text-destructive hover:bg-red-50 rounded-none">
            Returned/Cancel
          </Button>
        </>
      )}

      {currentStatus === 'cancelled' && (
        <span className="px-4 py-2 text-muted-foreground bg-muted/50 cursor-default">Order Closed</span>
      )}

      {currentStatus === 'delivered' && (
        <span className="px-4 py-2 text-muted-foreground bg-muted/50 cursor-default">Order Complete ✓</span>
      )}
    </div>
  );
}
