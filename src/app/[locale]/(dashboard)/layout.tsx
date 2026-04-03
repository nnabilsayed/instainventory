import { PWAInstallBanner } from '@/components/pwa-install-banner';
import MobileNav from '@/components/dashboard/mobile-nav';
import LanguageSwitcher from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react';
import { Toaster } from 'sonner';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/products', icon: Package, labelKey: 'products' },
  { href: '/orders', icon: ShoppingCart, labelKey: 'orders' },
  { href: '/customers', icon: Users, labelKey: 'customers' },
  { href: '/reviews', icon: Star, labelKey: 'reviews' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
] as const;

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
};

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = params;
  const t = await getTranslations('nav');
  const pathname = headers().get('x-pathname') ?? `/${locale}`;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function handleSignOut() {
    'use server';

    const serverSupabase = createClient();
    await serverSupabase.auth.signOut();
    redirect(`/${locale}/login`);
  }

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '/dashboard') {
      return pathname === `/${locale}` || pathname === `/${locale}/` || pathname === fullPath;
    }

    return pathname.startsWith(fullPath);
  };

  const userEmail = user?.email ?? '';
  const avatarLabel = userEmail ? userEmail.charAt(0).toUpperCase() : 'I';
  const userName = userEmail ? userEmail.split('@')[0] : 'InstaInventory Seller';
  const breadcrumbItems = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
    .filter((segment) => segment !== 'en' && segment !== 'ar')
    .map((segment) => {
      const navItem = navItems.find((item) => item.href.replace('/', '') === segment);
      return navItem ? t(navItem.labelKey) : segment.replace(/[-_]/g, ' ');
    });

  return (
    <div className="min-h-screen bg-[var(--background)] text-primary">
      <aside className="fixed inset-y-0 start-0 hidden w-[var(--sidebar-width)] flex-col border-e border-[var(--border)] bg-[var(--surface)] md:flex">
        <div className="flex h-topbar items-center border-b border-[var(--border)] ps-5 pe-5">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-coral)]" />
            <span className="text-base font-semibold text-[var(--text-primary)]">InstaInventory</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto ps-3 pe-3 pt-5 pb-5">
          <p className="ps-3 pe-3 text-2xs font-medium uppercase tracking-widest text-tertiary">
            Workspace
          </p>

          <nav className="mt-3 flex flex-col gap-1">
            {navItems.map(({ href, icon: Icon, labelKey }) => (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className={[
                  'flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[var(--radius-md)] ps-3 pe-3 text-sm transition-colors active:bg-[var(--surface-hover)]',
                  isActive(href)
                    ? 'bg-[#EEEDF0] font-medium text-[var(--accent-navy)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                ].join(' ')}
              >
                <Icon size={16} />
                <span>{t(labelKey)}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-3 ps-3 pe-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-hover)] text-sm font-semibold text-[var(--accent-navy)]">
                {avatarLabel}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{userName}</p>
                <p className="truncate text-xs text-[var(--text-secondary)]">
                  {userEmail || 'seller@instainventory.app'}
                </p>
              </div>
            </div>

            <div className="mt-4 ps-3 pe-3">
              <LanguageSwitcher className="w-full justify-center" />
            </div>

            <div className="mt-3 ps-3 pe-3">
              <form action={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start text-[var(--text-secondary)]"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-topbar items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] ps-4 pe-4 md:ms-[var(--sidebar-width)] md:ps-6 md:pe-6">
        <div className="flex items-center gap-2 md:hidden">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-coral)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">InstaInventory</span>
        </div>

        <div className="hidden items-center gap-2 text-sm text-[var(--text-secondary)] md:flex">
          {breadcrumbItems.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
              ) : null}
              <span
                data-breadcrumb-current={index === breadcrumbItems.length - 1 ? 'true' : undefined}
                className={
                  index === breadcrumbItems.length - 1
                    ? 'font-medium text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-sm font-semibold text-[var(--accent-navy)]">
            {avatarLabel}
          </div>
        </div>
      </header>

      <main className="h-screen overflow-y-auto pt-[var(--topbar-height)] pb-[calc(60px+var(--safe-bottom))] md:ms-[var(--sidebar-width)] md:pb-0">
        <div className="px-4 py-5 md:px-6 md:py-6">
          {children}
        </div>
      </main>

      <MobileNav locale={locale} />

      <Toaster
        position="bottom-center"
        richColors
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '13px',
            borderRadius: 'var(--radius-md)',
          },
          classNames: {
            success: 'border-[var(--success-text)]/20',
            error: 'border-[var(--danger-text)]/20',
          },
        }}
      />
      <PWAInstallBanner />
    </div>
  );
}
