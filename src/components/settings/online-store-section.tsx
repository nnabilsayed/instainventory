'use client';

import { updateSelfCheckoutEnabled } from '@/app/[locale]/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { useState } from 'react';

type OnlineStoreSectionProps = {
  shopId: string;
  slug: string;
  initialEnabled: boolean;
  appUrl: string;
};

export function OnlineStoreSection({
  shopId,
  slug,
  initialEnabled,
  appUrl,
}: OnlineStoreSectionProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const storeUrl = `${appUrl}/store/${slug}`;

  async function handleToggle() {
    const nextValue = !enabled;
    setEnabled(nextValue);
    setSaving(true);

    const { error } = await updateSelfCheckoutEnabled(nextValue);

    if (error) {
      setEnabled(!nextValue);
      notify.error(error);
      setSaving(false);
      return;
    }

    if (nextValue) {
      notify.success('Self-checkout enabled');
    } else {
      notify.success('Self-checkout disabled');
    }

    setSaving(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      notify.linkCopied();
    } catch {
      notify.error('Could not copy the store link');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xs font-medium uppercase tracking-widest text-secondary">Online Store</CardTitle>
        <CardDescription>
          Let customers browse your products and place orders directly from your catalogue without you creating a draft
          first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-hover)] p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Enable self-checkout</p>
            <p className="text-xs text-secondary">Customers can browse your catalogue and start orders themselves.</p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Enable self-checkout"
            disabled={saving}
            onClick={handleToggle}
            className={cn(
              'relative inline-flex min-h-[44px] w-[72px] flex-shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              enabled
                ? 'border-[var(--success-text)] bg-[var(--success-text)]'
                : 'border-[var(--border-strong)] bg-[var(--surface)]',
            )}
          >
            <span
              className={cn(
                'absolute h-8 w-8 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform',
                enabled ? 'translate-x-9' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        {enabled && !initialEnabled ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--warning-text)]/25 bg-[var(--warning-bg)] p-3">
            <p className="text-sm text-[var(--warning-text)]">
              Customers will be able to place orders without contacting you first. You&apos;ll still review every order
              before confirming.
            </p>
          </div>
        ) : null}

        {enabled ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-secondary">Catalogue URL</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-all text-sm font-medium text-primary">{storeUrl}</p>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleCopy}>
                <Copy size={16} />
                <span>Copy</span>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
