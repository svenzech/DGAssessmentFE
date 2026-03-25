import { NextRequest, NextResponse } from 'next/server';
import { readSessionFromRequest } from './app/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === '/login';
  const isPublicPath = isLoginPath || pathname === '/api/auth/session';

  const session = await readSessionFromRequest(request);

  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  if (session && isLoginPath) {
    const homeUrl = new URL('/', request.url);
    const response = NextResponse.redirect(homeUrl);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
};
