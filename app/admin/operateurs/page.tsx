'use client';

import { useEffect, useState } from 'react';
import { OperatorPublic, OperatorRole } from '@/types/operator';
import LogoutButton from '@/components/LogoutButton';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: OperatorRole;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'operator',
};

export default function OperateursAdminPage() {
  const [operators, setOperators] = useState<OperatorPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadOperators();
  }, []);

  async function loadOperators() {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/operators');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur de chargement');
      setOperators(data.operators ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger la liste des opérateurs');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(op: OperatorPublic) {
    setEditingId(op.id);
    setForm({
      firstName: op.firstName,
      lastName: op.lastName,
      email: op.email,
      password: '',
      role: op.role,
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/operators/${editingId}` : '/api/operators';
      const method = isEdit ? 'PUT' : 'POST';
      const payload: Partial<FormState> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
      };
      if (form.password) payload.password = form.password;

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors?.map((er: { message: string }) => er.message).join(', ') ?? data.error;
        throw new Error(msg ?? 'Erreur inconnue');
      }
      setSuccess(isEdit ? 'Opérateur mis à jour' : 'Opérateur créé');
      resetForm();
      await loadOperators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(op: OperatorPublic) {
    if (!confirm(`Supprimer l'opérateur ${op.firstName} ${op.lastName} ?`)) return;
    try {
      const res = await fetchWithAuth(`/api/operators/${op.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erreur');
      }
      setSuccess('Opérateur supprimé');
      if (editingId === op.id) resetForm();
      await loadOperators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  const isEdit = editingId !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a1a2e] text-white px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Administration — Comptes opérateurs</h1>
          <p className="text-sm text-gray-400">Gestion des comptes médecins (CRUD)</p>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {isEdit ? 'Modifier un opérateur' : 'Nouvel opérateur'}
            </h2>
            {isEdit && (
              <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-800">
                ✕ Annuler
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom" required>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jean"
                  required
                />
              </Field>
              <Field label="Nom" required>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Dupont"
                  required
                />
              </Field>
            </div>

            <Field label="Email" required>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jean.dupont@hopital.fr"
                required
              />
            </Field>

            <Field
              label={isEdit ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
              required={!isEdit}
            >
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Minimum 8 caractères"
                required={!isEdit}
                minLength={isEdit && !form.password ? undefined : 8}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Rôle" required>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as OperatorRole }))}
              >
                <option value="operator">Opérateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </Field>

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

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer l\'opérateur'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Opérateurs ({operators.length})
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : operators.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun opérateur enregistré.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {operators.map(op => (
                <li key={op.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate flex items-center gap-2">
                      <span className="truncate">
                        {op.lastName.toUpperCase()} {op.firstName}
                      </span>
                      {op.role === 'admin' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{op.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(op)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(op)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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
          padding: 12px 20px;
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

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
