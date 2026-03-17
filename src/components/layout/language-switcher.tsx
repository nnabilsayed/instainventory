'use client';

import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
      router.replace(newPath);
    });
  }

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--surface-hover)] p-1', className)}>
      <button
        disabled={isPending}
        onClick={() => onSelectChange('ar')}
        className={cn(
          'min-h-[36px] rounded-[calc(var(--radius-md)-2px)] px-2.5 text-xs font-medium transition-colors',
          locale === 'ar'
            ? 'bg-[var(--surface)] text-[var(--accent-navy)] shadow-[var(--shadow-sm)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        )}
      >
        عربي
      </button>
      <button
        disabled={isPending}
        onClick={() => onSelectChange('en')}
        className={cn(
          'min-h-[36px] rounded-[calc(var(--radius-md)-2px)] px-2.5 text-xs font-medium transition-colors',
          locale === 'en'
            ? 'bg-[var(--surface)] text-[var(--accent-navy)] shadow-[var(--shadow-sm)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        )}
      >
        EN
      </button>
    </div>
  );
}
