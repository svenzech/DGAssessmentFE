import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '../lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL('https://www.datareus.com'),
    303,
  );
  clearSessionCookie(response);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Clear-Site-Data', '"cache"');
  return response;
}
