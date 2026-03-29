'use client';

import { Button } from '@/components/ui/button';
import { notify } from '@/lib/toast';
import { Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function ShareStoreCard({ storeUrl }: { storeUrl: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      notify.linkCopied();
    } catch {
      notify.error('Could not copy the store link');
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--success-text)] bg-[var(--success-bg)] p-4 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--success-text)]">Your store is live</p>
      <p className="mt-2 break-all text-base font-semibold text-primary">{storeUrl}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="w-full border-[var(--success-text)]/30 bg-white/70 sm:w-auto" onClick={handleCopy}>
          <Copy size={16} />
          <span>Copy link</span>
        </Button>
        <Button type="button" className="w-full sm:w-auto" asChild>
          <Link href={storeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            <span>Open store</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
