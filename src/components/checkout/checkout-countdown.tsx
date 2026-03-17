'use client';

import { useEffect, useRef, useState } from 'react';

export function CheckoutCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    function calculate() {
      const diff = new Date(expiresAt).getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft({
          total: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpire?.();
        }

        return;
      }

      setTimeLeft({
        total: diff,
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.total < 30 * 60 * 1000;
  const isCritical = timeLeft.total < 10 * 60 * 1000;

  const bg = isCritical
    ? 'bg-[var(--danger-bg)] border-[var(--danger-text)]'
    : isUrgent
      ? 'bg-[var(--warning-bg)] border-[var(--warning-text)]'
      : 'bg-[var(--info-bg)] border-[var(--info-text)]';

  const text = isCritical
    ? 'text-[var(--danger-text)]'
    : isUrgent
      ? 'text-[var(--warning-text)]'
      : 'text-[var(--info-text)]';

  const label = isCritical
    ? 'Complete your order now!'
    : isUrgent
      ? 'Link expiring soon'
      : 'This link expires in';

  const timeString =
    timeLeft.hours > 0
      ? `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
      : `${timeLeft.minutes}m ${timeLeft.seconds}s`;

  return (
    <div
      className={`
        flex items-center justify-between
        rounded-[var(--radius-md)] border
        px-4 py-3 text-sm font-medium
        ${bg} ${text}
      `}
    >
      <span>{label}</span>
      <span className="font-mono font-semibold tabular-nums">{timeString}</span>
    </div>
  );
}

export default CheckoutCountdown;
