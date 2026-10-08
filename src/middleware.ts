import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session cookie on every request and protects
 * all routes except /login, /signup, static assets, and the public API
 * routes (tracking + scheduled send job).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
  const isPublicApiRoute = pathname.startsWith('/api/track') ||
    pathname.startsWith('/api/integrations') ||
    pathname.startsWith('/api/sync-demo-company') ||
    pathname.startsWith('/api/unsubscribe') ||
    pathname.startsWith('/api/send-review-requests') ||
    pathname.startsWith('/api/send-messages') ||
    pathname.startsWith('/api/scan-customer-lifecycle') ||
    pathname.startsWith('/api/ai-test') ||
    pathname.startsWith('/auth/callback');
  const isPublicPage = pathname.startsWith('/feedback/') || pathname.startsWith('/book/') || pathname.startsWith('/r/') || ['/privacy', '/terms', '/cookies', '/ai-test'].includes(pathname);

  if (!user && !isAuthPage && !isPublicApiRoute && !isPublicPage && pathname !== '/') {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
