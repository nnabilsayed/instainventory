import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 1. Create the next-intl middleware
const handleI18nRouting = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] === 'ar' || segments[0] === 'en' ? segments[0] : 'ar';
  const pathWithoutLocale = `/${segments.slice(1).join('/')}`;

  const isAuthPage = pathWithoutLocale === '/login' || pathWithoutLocale === '/signup';
  const isDashboardPage =
    pathWithoutLocale === '/dashboard' ||
    pathWithoutLocale.startsWith('/products') ||
    pathWithoutLocale.startsWith('/orders') ||
    pathWithoutLocale.startsWith('/customers') ||
    pathWithoutLocale.startsWith('/settings');
  const isPublicPage =
    pathWithoutLocale === '/' ||
    pathWithoutLocale.startsWith('/store') ||
    pathWithoutLocale.startsWith('/checkout') ||
    isAuthPage;

  if (isPublicPage && !isAuthPage) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isDashboardPage && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
