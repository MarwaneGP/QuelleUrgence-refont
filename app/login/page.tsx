'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { signInWithPassword } from '@/lib/authClient';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/operateur';

  useEffect(() => {
    async function check() {
      try {
        const sb = getSupabaseBrowser();
        const { data } = await sb.auth.getSession();
        if (data.session) {
          router.replace(nextPath);
        }
      } catch {
        // Ignore and keep login form visible
      }
    }
    void check();
  }, [nextPath, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signInWithPassword(email.trim().toLowerCase(), password);
    if (result.success) {
      router.replace(nextPath);
    } else {
      setError(result.error ?? 'Erreur de connexion');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion opérateur</h1>
          <p className="text-sm text-gray-500 mt-1">Accédez au formulaire et à l&apos;historique.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="jean.dupont@hopital.fr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700" htmlFor="login-password">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Pas de compte ?{' '}
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-[#1a1a2e] underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
