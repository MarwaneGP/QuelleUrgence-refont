'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { AuditLog, AuditLogListResult } from '@/types/auditLog';
import LogoutButton from '@/components/LogoutButton';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface Filters {
  action: string;
  resource: string;
  userEmail: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  action: '',
  resource: '',
  userEmail: '',
  from: '',
  to: '',
};

const PAGE_SIZE = 50;

const ACTION_PRESETS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'auth.login', label: 'Connexion' },
  { value: 'auth.login_failed', label: 'Connexion échouée' },
  { value: 'auth.logout', label: 'Déconnexion' },
  { value: 'operator.create', label: 'Création opérateur' },
  { value: 'operator.update', label: 'Modification opérateur' },
  { value: 'operator.delete', label: 'Suppression opérateur' },
  { value: 'operator.list', label: 'Liste opérateurs' },
  { value: 'triage.create', label: 'Création dossier (triage)' },
  { value: 'dossier.view', label: 'Consultation dossier' },
  { value: 'dossier.search', label: 'Recherche dossier' },
];

function actionLabel(action: string): string {
  const preset = ACTION_PRESETS.find(p => p.value === action);
  return preset?.label ?? action;
}

function actionBadgeClass(action: string): string {
  if (action.startsWith('auth.login_failed')) return 'bg-red-100 text-red-700';
  if (action.startsWith('auth.')) return 'bg-indigo-100 text-indigo-700';
  if (action.endsWith('.delete')) return 'bg-red-100 text-red-700';
  if (action.endsWith('.create')) return 'bg-emerald-100 text-emerald-700';
  if (action.endsWith('.update')) return 'bg-amber-100 text-amber-700';
  if (action.endsWith('.view') || action.endsWith('.list') || action.endsWith('.search'))
    return 'bg-sky-100 text-sky-700';
  return 'bg-gray-100 text-gray-700';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams();
    if (appliedFilters.action) params.set('action', appliedFilters.action);
    if (appliedFilters.resource) params.set('resource', appliedFilters.resource);
    if (appliedFilters.userEmail) params.set('userEmail', appliedFilters.userEmail);
    if (appliedFilters.from) params.set('from', new Date(appliedFilters.from).toISOString());
    if (appliedFilters.to) params.set('to', new Date(appliedFilters.to).toISOString());
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    queueMicrotask(() => {
      if (!controller.signal.aborted) setLoading(true);
    });

    fetchWithAuth(`/api/admin/logs?${params.toString()}`, { signal: controller.signal })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Erreur de chargement');
        }
        const data: AuditLogListResult = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setError(null);
      })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [appliedFilters, page]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(0);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a1a2e] text-white px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Administration — Journal d&apos;audit</h1>
          <p className="text-sm text-gray-400">
            Traçabilité des actions effectuées sur le site (connexions, formulaires, modifications…)
          </p>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Field label="Action">
              <select
                className="input"
                value={filters.action}
                onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              >
                {ACTION_PRESETS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Ressource">
              <input
                className="input"
                value={filters.resource}
                onChange={e => setFilters(f => ({ ...f, resource: e.target.value }))}
                placeholder="operator, dossier…"
              />
            </Field>
            <Field label="Email utilisateur">
              <input
                className="input"
                value={filters.userEmail}
                onChange={e => setFilters(f => ({ ...f, userEmail: e.target.value }))}
                placeholder="ex. medecin@hopital.fr"
              />
            </Field>
            <Field label="Du">
              <input
                type="datetime-local"
                className="input"
                value={filters.from}
                onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              />
            </Field>
            <Field label="Au">
              <input
                type="datetime-local"
                className="input"
                value={filters.to}
                onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              />
            </Field>
            <div className="md:col-span-5 flex flex-wrap gap-3 items-center justify-end">
              <button type="button" onClick={resetFilters} className="text-sm text-gray-500 hover:text-gray-800">
                Réinitialiser
              </button>
              <button type="submit" className="btn-primary">
                Filtrer
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {total} évènement{total > 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-400"
              >
                ← Précédent
              </button>
              <span>
                Page {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages || loading}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-400"
              >
                Suivant →
              </button>
            </div>
          </div>

          {error && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <p className="px-6 py-12 text-center text-sm text-gray-500">Chargement…</p>
          ) : logs.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-500">Aucun évènement.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Utilisateur</th>
                    <th className="px-4 py-3 text-left">Ressource</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">IP</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => {
                    const expanded = expandedId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionBadgeClass(log.action)}`}
                            >
                              {actionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {log.userEmail ?? <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {log.resource ?? <span className="text-gray-400">—</span>}
                            {log.resourceId && (
                              <span className="text-gray-400 ml-1">
                                #{log.resourceId.slice(0, 8)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {log.statusCode ?? <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {log.ip ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : log.id)}
                              className="text-xs text-gray-500 hover:text-gray-900"
                            >
                              {expanded ? 'Masquer' : 'Détails'}
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p><span className="font-semibold">ID :</span> {log.id}</p>
                                  <p><span className="font-semibold">Méthode :</span> {log.method ?? '—'}</p>
                                  <p><span className="font-semibold">Chemin :</span> {log.path ?? '—'}</p>
                                  <p className="truncate"><span className="font-semibold">User-Agent :</span> {log.userAgent ?? '—'}</p>
                                  <p><span className="font-semibold">User ID :</span> {log.userId ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">Détails :</p>
                                  <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap break-all">
                                    {JSON.stringify(log.details ?? {}, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          background: white;
        }
        .input:focus {
          border-color: #1a1a2e;
          box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.08);
        }
        .btn-primary {
          background: #1a1a2e;
          color: white;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
