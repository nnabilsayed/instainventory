'use client';

import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/layout/language-switcher';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '',         labelKey: 'dashboard', Icon: LayoutDashboard },
  { href: 'products', labelKey: 'products',  Icon: Package },
  { href: 'orders',   labelKey: 'orders',    Icon: ShoppingCart },
  { href: 'customers',labelKey: 'customers', Icon: Users },
  { href: 'settings', labelKey: 'settings',  Icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href ? `/${href}` : ''}`;
    if (href === '') {
      // Dashboard (root) is active only when exactly at /{locale}
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Sidebar - Desktop only */}
      <aside className="hidden border-r bg-white md:flex md:flex-col md:w-64 max-h-screen sticky top-0">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <span className="font-semibold text-lg">InstaInventory</span>
        </div>
        <nav className="grid gap-1 items-start px-2 text-sm font-medium lg:px-4 py-4">
          {navItems.map(({ href, labelKey, Icon }) => (
            <Link
              key={href}
              href={`/${locale}${href ? `/${href}` : ''}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive(href)
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey as any)}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 pb-16 md:pb-0">
        {/* Topbar */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 justify-between md:justify-end sticky top-0 z-30">
          <div className="md:hidden font-semibold">InstaInventory</div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="h-8 w-8 rounded-full bg-slate-200"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-white h-16 px-2">
        {navItems.map(({ href, labelKey, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={`/${locale}${href ? `/${href}` : ''}`}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-lg transition-colors ${
                active ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
              <span className="text-[10px] font-medium leading-tight">
                {t(labelKey as any)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
