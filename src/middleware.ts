import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 1. Create the next-intl middleware
const handleI18nRouting = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export async function middleware(request: NextRequest) {
  // 2. Run i18n routing first to get the base response
  const response = handleI18nRouting(request);

  // 3. Create supabase client to handle auth context and refresh tokens
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

  // 4. Get active session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.includes('/login') || request.nextUrl.pathname.includes('/signup');
  const isDashboardPage = request.nextUrl.pathname.includes('/dashboard') || 
                          request.nextUrl.pathname.includes('/products') || 
                          request.nextUrl.pathname.includes('/orders') || 
                          request.nextUrl.pathname.includes('/customers') || 
                          request.nextUrl.pathname.includes('/settings');

  // 5. Redirect unauthenticated users from protected routes
  if (isDashboardPage && !user) {
    const locale = request.nextUrl.pathname.split('/')[1] || 'ar';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  // 6. Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const locale = request.nextUrl.pathname.split('/')[1] || 'ar';
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
