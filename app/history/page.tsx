"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import Link from 'next/link';

type DossierHistoryItem = {
  accessCode: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
};

export default function HistoryPage() {
  const [history, setHistory] = useState<DossierHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory(phone = phoneQuery, accessCode = idQuery) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (phone.trim()) params.set('phone', phone.trim());
    if (accessCode.trim()) params.set('id', accessCode.trim().toUpperCase());

    try {
      const res = await fetch(`/api/dossiers?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Impossible de charger l’historique');
      }
      const data = await res.json();
      setHistory(data.dossiers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement de l’historique');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadHistory(phoneQuery, idQuery);
  }

  function resetSearch() {
    setPhoneQuery('');
    setIdQuery('');
    loadHistory('', '');
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 pb-24 md:pb-8 md:pl-64"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8 animate-fade-in">
          {/* Header section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Historique des dossiers
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] font-semibold -mt-3">
              Consultez et recherchez parmi les dossiers de triage patient générés.
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
                  ID Dossier
                </label>
                <input
                  id="id-filter"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-[var(--border-radius-md)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-mono font-bold"
                  value={idQuery}
                  onChange={e => setIdQuery(e.target.value.toUpperCase())}
                  placeholder="QU-XXXXXX"
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
              <Loading message="Recherche des dossiers en cours..." />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : history.length === 0 ? (
              <div className="bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-[var(--border-radius-lg)] p-8 text-center text-[var(--text-muted)] font-bold shadow-[var(--shadow-sm)]">
                Aucun dossier ne correspond aux critères de recherche.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map(dossier => (
                  <Link
                    key={dossier.accessCode}
                    href={`/dossier/${encodeURIComponent(dossier.accessCode)}`}
                    className="block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--border-radius-md)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <p className="font-extrabold text-sm font-mono tracking-widest bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-[var(--border-radius-sm)] border border-[var(--primary-border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                        {dossier.accessCode}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-light)]">
                        {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-base text-[var(--text-main)]">
                        {dossier.patient.firstName} {dossier.patient.lastName}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-muted)]">
                        {dossier.patient.phone || 'Téléphone non renseigné'}
                      </p>
                      {dossier.patient.email && (
                        <p className="text-xs font-medium text-[var(--text-light)] truncate">
                          {dossier.patient.email}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-[var(--border-color)] my-4" />

                    <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--primary)]">
                      <span>Voir l'analyse de triage</span>
                      <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
