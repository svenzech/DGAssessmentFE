import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '../lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect('https://www.datareus.com');
  clearSessionCookie(response);
  return response;
}
