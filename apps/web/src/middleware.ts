import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-cookie';

const PROTECTED_PATH_PREFIXES = ['/me', '/exchanges', '/profile', '/admin'];
const LOGIN_PATH = '/login';

function isUnderPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Sends guests away from pages that need a session. Signed-in users on /login or /register are
 * redirected by the client, so a leftover cookie can never lock anyone out of the login page.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(ACCESS_TOKEN_COOKIE);

  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) => isUnderPrefix(pathname, prefix));
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/me/:path*', '/exchanges/:path*', '/profile/:path*', '/admin/:path*'],
};
