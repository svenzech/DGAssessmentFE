import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '../lib/auth';

export async function POST(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  clearSessionCookie(response);
  return response;
}
