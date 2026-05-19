'use client';

import { useState } from 'react';
import { Dossier } from '@/types/triage';
import DossierView from '@/components/triage/DossierView';

export default function DossierPage() {
  const [code, setCode] = useState('');
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchDossier(accessCode: string) {
    const clean = accessCode.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossier/${encodeURIComponent(clean)}`);
      if (res.status === 404) throw new Error('Dossier introuvable. Vérifiez le code saisi.');
      if (!res.ok) throw new Error('Erreur lors de la récupération du dossier.');
      const data: Dossier = await res.json();
      setDossier(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchDossier(code);
  }

  if (dossier) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#1a1a2e] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">QuelleUrgence — Dossier Patient</h1>
            <p className="text-sm text-gray-400 font-mono">{dossier.accessCode}</p>
          </div>
          <button
            onClick={() => { setDossier(null); setCode(''); }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Nouveau code
          </button>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <DossierView dossier={dossier} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">QuelleUrgence</h1>
          <p className="text-gray-500 mt-2">Accès au dossier patient</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Code d'accès du dossier
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="QU-XXXXXX"
                maxLength={9}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-xl font-mono font-bold tracking-widest outline-none focus:border-[#1a1a2e] focus:ring-2 focus:ring-[#1a1a2e]/10 uppercase"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 3}
              className="w-full bg-[#1a1a2e] text-white py-3 rounded-lg font-semibold disabled:opacity-40 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : 'Accéder au dossier'}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Accès réservé au personnel médical autorisé.<br />
              En cas d'urgence vitale, appelez le <strong>15</strong> ou le <strong>112</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
