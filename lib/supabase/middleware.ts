import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/auth/callback', '/invite', '/forgot-password', '/reset-password', '/api/auth/register', '/api/webhooks', '/apply', '/api/applications', '/problems', '/results', '/blog', '/about', '/skaleflow', '/homepage', '/book', '/api/bookings', '/book-a-call', '/api/book-a-call', '/call'];
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    publicRoutes.some(route =>
      request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
    );

  if (!user && !isPublicRoute) {
    // No user and trying to access protected route, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
