import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/layout/language-switcher';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const locale = useLocale();

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden border-r bg-white md:block md:w-64 max-h-screen sticky top-0">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <span className="font-semibold text-lg">InstaInventory</span>
        </div>
        <nav className="grid gap-2 items-start px-2 text-sm font-medium lg:px-4 py-4">
          <MenuLink locale={locale} href="" label={t('dashboard')} />
          <MenuLink locale={locale} href="products" label={t('products')} />
          <MenuLink locale={locale} href="orders" label={t('orders')} />
          <MenuLink locale={locale} href="customers" label={t('customers')} />
          <MenuLink locale={locale} href="settings" label={t('settings')} />
        </nav>
      </aside>

      <div className="flex flex-col flex-1 pb-10">
        {/* Topbar */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 justify-between md:justify-end sticky top-0 z-30">
          <div className="md:hidden font-semibold">
            InstaInventory
          </div>
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
    </div>
  );
}

function MenuLink({ href, label, locale }: { href: string; label: string; locale: string }) {
  return (
    <Link
      href={`/${locale}/${href}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}
