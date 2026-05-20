'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function OperatorAuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const sb = getSupabaseBrowser();
        const { data } = await sb.auth.getSession();
        const hasSession = Boolean(data.session);

        if (!hasSession) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/operateur')}`);
          return;
        }
      } catch {
        router.replace(`/login?next=${encodeURIComponent(pathname || '/operateur')}`);
        return;
      }

      if (mounted) setChecking(false);
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Vérification de la session..." ariaLabel="Vérification de la session opérateur" />
      </div>
    );
  }

  return <>{children}</>;
}
