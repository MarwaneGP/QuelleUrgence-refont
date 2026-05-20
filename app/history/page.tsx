"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type Caller = {
  prenom?: string;
  nom?: string;
  telephone?: string;
};

type Location = {
  ville?: string;
  adresse_rue_et_num?: string;
};

type OperatorCall = {
  id: string;
  operatorId: string;
  caller: Caller;
  location: Location;
  event: unknown;
  vitalAssessment: unknown;
  remarqueGenerale?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function HistoryPage() {
  const [calls, setCalls] = useState<OperatorCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      try {
        const sb = getSupabaseBrowser();
        const { data, error: authError } = await sb.auth.getSession();
        if (authError || !data.session?.access_token) {
          setError('Session invalide. Veuillez vous reconnecter.');
          setLoading(false);
          return;
        }
        setAuthToken(data.session.access_token);
        await loadHistory(data.session.access_token);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors de l\'initialisation');
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  async function loadHistory(token: string, phone = phoneQuery, callId = idQuery) {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch('/api/operators/calls', { headers });
      if (!res.ok) {
        throw new Error('Impossible de charger l\'historique des appels');
      }
      const data = await res.json();
      let filteredCalls = data.calls ?? [];

      // Apply filters
      if (phone.trim()) {
        filteredCalls = filteredCalls.filter((call: OperatorCall) =>
          call.caller.telephone?.includes(phone.trim())
        );
      }
      if (callId.trim()) {
        filteredCalls = filteredCalls.filter((call: OperatorCall) =>
          call.id.toLowerCase().includes(callId.trim().toLowerCase())
        );
      }

      setCalls(filteredCalls);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    if (!authToken) return;
    loadHistory(authToken, phoneQuery, idQuery);
  }

  function resetSearch() {
    if (!authToken) return;
    setPhoneQuery('');
    setIdQuery('');
    loadHistory(authToken, '', '');
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 pb-24 md:pb-8"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8 animate-fade-in">
          {/* Header section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Historique des appels
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] font-semibold -mt-3">
              Consultez et recherchez parmi vos appels d&apos;urgence enregistrés.
            </p>
          </div>

          {/* Filters section */}
          <section className="bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-[var(--border-radius-lg)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="text-base font-extrabold text-[var(--text-main)] mb-5 uppercase tracking-wider">
              Filtres de recherche
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]" htmlFor="phone-filter">
                  Numéro de téléphone
                </label>
                <input
                  id="phone-filter"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-[var(--border-radius-md)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-semibold"
                  type="tel"
                  value={phoneQuery}
                  onChange={e => setPhoneQuery(e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]" htmlFor="id-filter">
                  ID Appel
                </label>
                <input
                  id="id-filter"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-[var(--border-radius-md)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-mono font-bold"
                  value={idQuery}
                  onChange={e => setIdQuery(e.target.value)}
                  placeholder="CALL-XXXXXX"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-[var(--border-radius-md)] hover:bg-[var(--primary-hover)] transition-all text-sm disabled:opacity-50"
                onClick={handleSearch}
                disabled={loading}
              >
                Rechercher
              </button>
              <button
                className="px-5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] font-bold rounded-[var(--border-radius-md)] hover:bg-[var(--border-color)] transition-all text-sm"
                onClick={resetSearch}
              >
                Réinitialiser
              </button>
            </div>
          </section>

          {/* Results list */}
          <section className="space-y-6">
            {loading ? (
              <Loading message="Chargement de vos appels en cours..." />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : history.length === 0 ? (
              <div className="bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-[var(--border-radius-lg)] p-8 text-center text-[var(--text-muted)] font-bold shadow-[var(--shadow-sm)]">
                Aucun appel ne correspond aux critères de recherche.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {calls.map(call => (
                  <div
                    key={call.id}
                    className="block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--border-radius-md)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <p className="text-xs font-semibold text-[var(--text-light)]">
                        Dossier:
                      </p>
                      <p className="font-extrabold text-xs font-mono tracking-widest bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-[var(--border-radius-sm)] border border-[var(--primary-border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                        {call.id ? `${call.id}` : `###`}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-base text-[var(--text-main)]">
                        {call.caller.prenom} {call.caller.nom}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-muted)]">
                        {call.caller.telephone || 'Téléphone non renseigné'}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-muted)]">
                        {call.location?.adresse_rue_et_num}
                      </p>
                    </div>

                    <div className="border-t border-[var(--border-color)] my-4" />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)]">Statut</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-[var(--border-radius-sm)] ${
                          call.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                        <p className="text-xs font-semibold text-[var(--text-light)]">
                        {new Date(call.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      </div>
                      {call.remarqueGenerale && (
                        <p className="text-xs text-[var(--text-light)] italic">
                          Remarque: {call.remarqueGenerale}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
