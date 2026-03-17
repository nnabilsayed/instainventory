'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      notify.error('Failed to delete product');
    } else {
      notify.productDeleted();
      router.refresh();
      setConfirmOpen(false);
    }
    setDeleting(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] p-2 text-[var(--danger-text)] transition-colors hover:bg-[var(--danger-bg)]"
        aria-label="Delete product"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete product?"
        message="This will permanently delete the product and all its variants. Any existing orders with this product will not be affected."
        confirmLabel="Delete product"
        cancelLabel="Keep it"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
