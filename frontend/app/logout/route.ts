import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '../lib/auth';

function buildLogoutResponse() {
  const response = NextResponse.redirect(
    new URL('https://www.datareus.com'),
    303,
  );
  clearSessionCookie(response);
  return response;
}

export async function GET(_request: NextRequest) {
  return buildLogoutResponse();
}

export async function POST(_request: NextRequest) {
  return buildLogoutResponse();
}
