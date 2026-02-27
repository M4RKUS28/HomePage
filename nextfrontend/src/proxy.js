/**
 * Proxy — NextAuth.js session-based route protection + next-intl locale routing.
 *
 * Uses NextAuth's `auth` helper to read the JWT session from the cookie.
 * Protected routes redirect unauthenticated users to /login.
 * Auth routes (/login, /register) redirect authenticated users to /dashboard.
 *
 * Also handles locale detection and URL prefixing via next-intl.
 *
 * Next.js 16 renamed the "middleware" convention to "proxy".
 */
import { auth } from './auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip locale handling for API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Run next-intl middleware first to handle locale detection/redirect
  const intlResponse = intlMiddleware(req);

  // Determine the actual path without locale prefix for auth checks
  const localePattern = /^\/(en|de)(\/|$)/;
  const match = pathname.match(localePattern);
  const locale = match ? match[1] : routing.defaultLocale;
  const pathWithoutLocale = match ? pathname.replace(localePattern, '/') : pathname;

  const isLoggedIn = !!req.auth;

  const protectedRoutes = ['/dashboard', '/admin'];
  const authRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathWithoutLocale.startsWith(route));

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return intlResponse;
});

export const config = {
  matcher: [
    // Match all paths except api, _next, and static files
    '/((?!api|_next|.*\\..*).*)',
  ],
};
