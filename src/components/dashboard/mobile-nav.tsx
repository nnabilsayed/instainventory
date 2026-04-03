'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Home, Package, Settings, ShoppingBag, Users } from 'lucide-react';

const navItems = [
  { href: '', icon: Home, labelKey: 'dashboard' },
  { href: '/orders', icon: ShoppingBag, labelKey: 'orders' },
  { href: '/products', icon: Package, labelKey: 'products' },
  { href: '/customers', icon: Users, labelKey: 'customers' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
] as const;

type MobileNavProps = {
  locale: string;
};

export default function MobileNav({ locale }: MobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;

    if (href === '') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }

    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  return (
    <nav
      className="fixed bottom-0 start-0 end-0 z-50 flex h-[60px] border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      {navItems.map(({ href, icon: Icon, labelKey }) => {
        const fullPath = `/${locale}${href}`;
        const active = isActive(href);

        return (
          <Link
            key={fullPath}
            href={fullPath}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
              active ? 'text-[var(--accent-navy)]' : 'text-[var(--text-tertiary)]',
            ].join(' ')}
          >
            <Icon size={20} />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
