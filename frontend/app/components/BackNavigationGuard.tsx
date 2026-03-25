'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function BackNavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/login') {
      return;
    }

    let cancelled = false;

    async function verifySession() {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) {
            router.replace('/login');
          }
          return;
        }

        const data = (await res.json()) as { authenticated?: boolean };
        if (!data?.authenticated && !cancelled) {
          router.replace('/login');
        }
      } catch {
        if (!cancelled) {
          router.replace('/login');
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

    void verifySession();

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
