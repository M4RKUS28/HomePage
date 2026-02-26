import { NextResponse } from 'next/server';

/**
 * Middleware - lightweight session-existence check.
 *
 * We only check whether the encrypted `hp_session` cookie exists.
 * Actual validation happens in the API routes / proxy (iron-session
 * decrypts + verifies integrity there).
 */
export function middleware(request) {
  const hasSession = request.cookies.has('hp_session');
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/admin'];
  const authRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
