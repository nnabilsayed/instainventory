import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function OrderNotFound() {
  const locale = await getLocale();

  return (
    <div className="mx-auto mt-20 max-w-2xl space-y-5 p-6 text-center">
      <div className="text-5xl">📦</div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-primary">Order not found</h1>
        <p className="text-sm text-secondary">This order doesn&apos;t exist or may have been deleted.</p>
      </div>
      <Link
        href={`/${locale}/orders`}
        className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-6 text-sm font-medium text-white"
      >
        Back to Orders
      </Link>
    </div>
  );
}
