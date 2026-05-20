'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithPassword } from '@/lib/authClient';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/operateur';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }
      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      const createRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const createBody = await createRes.json();
      if (!createRes.ok) {
        const msg =
          createBody.errors?.map((x: { message: string }) => x.message).join(', ') ||
          createBody.error ||
          'Erreur de création du compte';
        throw new Error(msg);
      }

      const signIn = await signInWithPassword(email.trim().toLowerCase(), password);
      if (!signIn.success) throw new Error(signIn.error ?? 'Erreur de connexion');

      setSuccess('Compte créé. Redirection...');
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte opérateur</h1>
          <p className="text-sm text-gray-500 mt-1">Ce compte sera utilisé pour accéder au formulaire et à l&apos;historique.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700" htmlFor="signup-first-name">Prénom</label>
              <input
                id="signup-first-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Jean"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700" htmlFor="signup-last-name">Nom</label>
              <input
                id="signup-last-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label className="block text-sm font-medium text-gray-700" htmlFor="signup-password">Mot de passe</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Minimum 8 caractères"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700" htmlFor="signup-confirm-password">Confirmer le mot de passe</label>
            <input
              id="signup-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Répétez le mot de passe"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Déjà un compte ?{' '}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-[#1a1a2e] underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
