'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function BackNavigationGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') {
      return;
    }

    let cancelled = false;

    function forceLogin() {
      window.location.replace('/login');
    }

    function hasAuthStateCookie() {
      return document.cookie
        .split(';')
        .map((v) => v.trim())
        .some((v) => v === 'dg_auth_state=1');
    }

    async function verifySession() {
      if (!hasAuthStateCookie()) {
        if (!cancelled) {
          forceLogin();
        }
        return;
      }

      try {
        const res = await fetch(`/api/auth/session?ts=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) {
            forceLogin();
          }
          return;
        }

        const data = (await res.json()) as { authenticated?: boolean };
        if (!data?.authenticated && !cancelled) {
          forceLogin();
        }
      } catch {
        if (!cancelled) {
          forceLogin();
        }
      }
    }

    const onPageShow = () => {
      void verifySession();
    };
    const onPopState = () => {
      void verifySession();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifySession();
      }
    };
    const onUnload = () => {};

    void verifySession();

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('unload', onUnload);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('unload', onUnload);
    };
  }, [pathname]);

  return null;
}
