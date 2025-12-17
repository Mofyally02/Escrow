import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/buyer',
  '/seller',
  '/admin',
  '/dashboard',
  '/transactions',
  '/credentials',
];

// Public routes (accessible without auth)
const publicRoutes = [
  '/',
  '/catalog',
  '/login',
  '/register',
  '/register/verify',
  '/register/success',
  '/login/verify',
];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  buyer: ['/buyer', '/dashboard', '/catalog', '/transactions'],
  seller: ['/seller', '/dashboard', '/catalog'],
  admin: ['/admin', '/dashboard'],
  super_admin: ['/admin', '/dashboard'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const isPublicRoute = publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/login');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    // Check for auth cookie (set by backend)
    const authCookie = request.cookies.get('access_token') ||
      request.cookies.get('refresh_token');

    if (!authCookie) {
      // No auth cookie - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Auth cookie exists - let client-side handle role-based routing
    // The API will return 401/403 if user doesn't have access
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

