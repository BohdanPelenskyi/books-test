import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-cookie';

const PROTECTED_PATH_PREFIXES = ['/me', '/exchanges', '/profile', '/admin'];
const GUEST_ONLY_PATHS = ['/login', '/register'];
const LOGIN_PATH = '/login';
const DEFAULT_AUTHENTICATED_PATH = '/books';

function isUnderPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = request.cookies.has(ACCESS_TOKEN_COOKIE);

  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) => isUnderPrefix(pathname, prefix));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && GUEST_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/me/:path*',
    '/exchanges/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
