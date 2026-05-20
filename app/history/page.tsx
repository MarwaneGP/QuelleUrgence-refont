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
  const [selectedCall, setSelectedCall] = useState<OperatorCall | null>(null);
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedCall(null);
      }
    }

    if (!selectedCall) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCall]);

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

  function prettyPrint(value: unknown): string {
    if (value == null) return 'Non renseigne';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
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
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Historique des appels
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] font-semibold -mt-3">
              Consultez et recherchez parmi vos appels d'urgence enregistres.
            </p>
          </div>

          <section className="bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-[var(--border-radius-lg)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="text-base font-extrabold text-[var(--text-main)] mb-5 uppercase tracking-wider">
              Filtres de recherche
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]" htmlFor="phone-filter">
                  Numero de telephone
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
                Reinitialiser
              </button>
            </div>
          </section>

          <section className="space-y-6">
            {loading ? (
              <Loading message="Chargement de vos appels en cours..." />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : calls.length === 0 ? (
              <div className="bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-[var(--border-radius-lg)] p-8 text-center text-[var(--text-muted)] font-bold shadow-[var(--shadow-sm)]">
                Aucun appel ne correspond aux criteres de recherche.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {calls.map(call => (
                  <button
                    type="button"
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className="block text-left w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--border-radius-md)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-300 group"
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
                        {call.caller.telephone || 'Telephone non renseigne'}
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
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedCall && (
        <div
          className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedCall(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Details de l'appel ${selectedCall.id}`}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-[var(--text-light)]">Details appel</p>
                <h2 className="text-xl font-extrabold text-[var(--text-main)] mt-1">{selectedCall.id}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-input)]"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
              <div className="bg-[var(--bg-input)] rounded-xl p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-light)]">Patient</p>
                <p className="mt-2 font-semibold">{selectedCall.caller.prenom} {selectedCall.caller.nom}</p>
                <p className="text-[var(--text-muted)]">{selectedCall.caller.telephone || 'Telephone non renseigne'}</p>
              </div>
              <div className="bg-[var(--bg-input)] rounded-xl p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-light)]">Localisation</p>
                <p className="mt-2 font-semibold">{selectedCall.location?.ville || 'Ville non renseignee'}</p>
                <p className="text-[var(--text-muted)]">{selectedCall.location?.adresse_rue_et_num || 'Adresse non renseignee'}</p>
              </div>
              <div className="bg-[var(--bg-input)] rounded-xl p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-light)]">Statut</p>
                <p className="mt-2 font-semibold">{selectedCall.status}</p>
                <p className="text-[var(--text-muted)]">Cree le {new Date(selectedCall.createdAt).toLocaleString('fr-FR')}</p>
                <p className="text-[var(--text-muted)]">Mis a jour le {new Date(selectedCall.updatedAt).toLocaleString('fr-FR')}</p>
              </div>
              <div className="bg-[var(--bg-input)] rounded-xl p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-light)]">Remarque</p>
                <p className="mt-2 font-semibold whitespace-pre-wrap">{selectedCall.remarqueGenerale || 'Aucune remarque'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-[var(--bg-input)] rounded-xl p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-light)]">Evenement</p>
                <pre className="mt-2 text-xs leading-5 whitespace-pre-wrap break-words text-[var(--text-main)]">
                  {prettyPrint(selectedCall.event)}
                </pre>
              </div>
              <div className="bg-[var(--bg-input)] rounded-xl p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-light)]">Bilan vital</p>
                <pre className="mt-2 text-xs leading-5 whitespace-pre-wrap break-words text-[var(--text-main)]">
                  {prettyPrint(selectedCall.vitalAssessment)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
