import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_STATE_COOKIE_NAME,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  validateCredentials,
} from '../lib/auth';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function handleLogin(formData: FormData) {
  'use server';

  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!validateCredentials(username, password)) {
    redirect('/login?error=1');
  }

  const token = await createSessionToken({
    username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  cookieStore.set({
    name: AUTH_STATE_COOKIE_NAME,
    value: '1',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  redirect('/');
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const hasError = resolvedSearchParams.error === '1';

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="text-sm text-gray-600">
            Bitte mit einem freigegebenen Admin-Konto anmelden.
          </p>
        </header>

        {hasError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Anmeldung fehlgeschlagen. Benutzername oder Passwort ungültig.
          </p>
        )}

        <form action={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm text-gray-700">
              Benutzername
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-gray-700">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Anmelden
          </button>
        </form>
      </section>
    </main>
  );
}
