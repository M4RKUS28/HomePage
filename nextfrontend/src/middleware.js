import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check both cookie names:
  //   access_token  – httpOnly cookie set by NextJS /api/auth/* routes
  //   accessToken   – non-httpOnly cookie set by AuthContext (client-side)
  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('accessToken')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/admin'];
  const authRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
