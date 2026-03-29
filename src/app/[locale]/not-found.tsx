import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="select-none text-[80px] font-bold leading-none text-[var(--border-strong)]">404</div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-primary">Page not found</h1>
          <p className="text-sm text-secondary">This page doesn&apos;t exist or has been removed.</p>
        </div>

        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
