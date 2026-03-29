import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function DashboardNotFound() {
  const locale = await getLocale();

  return (
    <div className="mx-auto mt-20 max-w-2xl space-y-5 p-6 text-center">
      <div className="select-none text-[64px] font-bold leading-none text-[var(--border-strong)]">404</div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-primary">Page not found</h1>
        <p className="text-sm text-secondary">This page doesn&apos;t exist in your dashboard.</p>
      </div>
      <Link
        href={`/${locale}/dashboard`}
        className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-6 text-sm font-medium text-white"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
