import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the token from cookies or headers (adjust based on how you store tokens)
  const token = request.cookies.get('accessToken') || 
    request.headers.get('authorization')?.replace('Bearer ', '');
  
  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/admin'];
  const authRoutes = ['/login', '/register'];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If trying to access auth routes with token, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register']
};
