import { NextRequest, NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  const session = await readSessionFromRequest(request);

  return NextResponse.json(
    {
      authenticated: !!session,
      user: session
        ? { username: session.username, role: session.role }
        : null,
    },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
