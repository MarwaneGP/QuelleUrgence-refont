'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type GuardState =
  | { kind: 'checking' }
  | { kind: 'forbidden' }
  | { kind: 'ok' };

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>({ kind: 'checking' });

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const sb = getSupabaseBrowser();
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!active) return;

        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
          return;
        }

        if (!res.ok) {
          setState({ kind: 'forbidden' });
          return;
        }

        const me = (await res.json()) as { role?: string };
        if (me.role !== 'admin') {
          setState({ kind: 'forbidden' });
          return;
        }

        if (active) setState({ kind: 'ok' });
      } catch {
        if (active) setState({ kind: 'forbidden' });
      }
    }

    void check();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (state.kind === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Vérification des droits administrateur..." ariaLabel="Vérification des droits administrateur" />
      </div>
    );
  }

  if (state.kind === 'forbidden') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900">Accès refusé</h1>
          <p className="text-sm text-gray-600">
            Cette section est réservée aux administrateurs. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
            contactez votre administrateur.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/operateur')}
            className="inline-block bg-[#1a1a2e] text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Retour à l&apos;espace opérateur
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
