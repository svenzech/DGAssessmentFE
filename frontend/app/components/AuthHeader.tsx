import { cookies } from 'next/headers';
import { readSessionFromToken, SESSION_COOKIE_NAME } from '../lib/auth';

export async function AuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await readSessionFromToken(token);

  if (!session) {
    return null;
  }

  return (
    <header className="border-b bg-white/90">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-700">
          Angemeldet als <span className="font-semibold">{session.username}</span>{' '}
          (<span className="font-mono">admin</span>)
        </div>
        <a
          href="/logout"
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Logout
        </a>
      </div>
    </header>
  );
}
