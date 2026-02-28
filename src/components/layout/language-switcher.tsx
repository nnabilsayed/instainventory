'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      // Create the new path by replacing the current locale prefix
      // Example: /ar/dashboard -> /en/dashboard
      const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
      router.replace(newPath);
    });
  }

  return (
    <div className="flex gap-2 items-center text-sm font-bold bg-slate-100 p-1 rounded-md">
      <button 
        disabled={isPending}
        onClick={() => onSelectChange('ar')}
        className={`px-2 py-1 rounded ${locale === 'ar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
      >
        عربي
      </button>
      <button 
        disabled={isPending}
        onClick={() => onSelectChange('en')}
        className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
      >
        EN
      </button>
    </div>
  );
}
