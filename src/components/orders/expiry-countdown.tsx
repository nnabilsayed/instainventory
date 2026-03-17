'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatExpiryCountdown, getRemainingExpiryMs } from '@/lib/order-expiry';
import { cn } from '@/lib/utils';

export default function ExpiryCountdown({
  expiresAt,
  className,
  prefix = 'Time left',
  expiredLabel = 'Expired',
  onExpire,
}: {
  expiresAt?: string | null;
  className?: string;
  prefix?: string;
  expiredLabel?: string;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const didExpireRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  const remainingMs = useMemo(() => getRemainingExpiryMs(expiresAt, now), [expiresAt, now]);

  useEffect(() => {
    if (remainingMs > 0 || didExpireRef.current) return;

    didExpireRef.current = true;
    onExpire?.();
  }, [onExpire, remainingMs]);

  if (!expiresAt) return null;

  const hasExpired = remainingMs <= 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        hasExpired
          ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
          : 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
        className,
      )}
    >
      <span>{hasExpired ? expiredLabel : prefix}</span>
      {!hasExpired ? <span className="font-mono">{formatExpiryCountdown(expiresAt, now)}</span> : null}
    </div>
  );
}
