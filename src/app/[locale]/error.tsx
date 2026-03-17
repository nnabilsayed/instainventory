'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="text-5xl">⚠️</div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-primary">Something went wrong</h1>
          <p className="text-sm text-secondary">An unexpected error occurred. Your data is safe.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full min-h-[44px] rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)]"
          >
            Try again
          </button>
          <Link
            href={`/${locale}/dashboard`}
            className="flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-sm font-medium text-secondary transition-colors hover:bg-[var(--surface-hover)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
