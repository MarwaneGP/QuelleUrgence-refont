'use client';

import { useState, useEffect } from 'react';
import { CreateDossierResponse } from '@/types/triage';
import Header from '@/components/Header';

const COMMON_SYMPTOMS = [
  'Douleur thoracique',
  'Essoufflement',
  'Douleur abdominale',
  'Maux de tête sévères',
  'Perte de conscience',
  'Convulsions',
  'Paralysie / faiblesse soudaine',
  'Trouble de la vision',
  'Trouble de la parole',
  'Saignement important',
  'Fièvre élevée (> 39°C)',
  'Vomissements',
  'Douleur dorsale',
  'Douleur articulaire',
  'Éruption cutanée',
  'Traumatisme / chute',
  'Brûlure',
  'Coupure profonde',
  'Perte de mémoire soudaine',
  'Douleur urinaire',
];

type Step = 'patient' | 'symptoms' | 'location' | 'confirm' | 'result';

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

interface FormData {
  firstName: string;
  lastName: string;
  age: string;
  gender: 'homme' | 'femme' | 'autre';
  phone: string;
  email: string;
  symptoms: string[];
  symptomDescription: string;
  durationHours: string;
  hasChronicConditions: boolean;
  chronicConditions: string;
  hasAllergies: boolean;
  allergies: string;
  latitude: string;
  longitude: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  age: '',
  gender: 'homme',
  phone: '',
  email: '',
  symptoms: [],
  symptomDescription: '',
  durationHours: '',
  hasChronicConditions: false,
  chronicConditions: '',
  hasAllergies: false,
  allergies: '',
  latitude: '',
  longitude: '',
};

export default function OperateurPage() {
  const [step, setStep] = useState<Step>('patient');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateDossierResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [history, setHistory] = useState<DossierHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPhone, setHistoryPhone] = useState('');
  const [historyId, setHistoryId] = useState('');
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (step === 'location' && !form.latitude) {
      locateUser();
    }
  }, [step]);

  function locateUser() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function toggleSymptom(s: string) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));
  }

  async function loadHistory(phone = historyPhone, accessCode = historyId) {
    setHistoryLoading(true);
    setHistoryError(null);

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
      setHistoryError(e instanceof Error ? e.message : 'Erreur lors du chargement de l’historique');
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleSearch() {
    loadHistory(historyPhone, historyId);
  }

  function resetSearch() {
    setHistoryPhone('');
    setHistoryId('');
    loadHistory('', '');
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            firstName: form.firstName,
            lastName: form.lastName,
            age: parseInt(form.age),
            gender: form.gender,
            phone: form.phone,
            email: form.email,
          },
          symptoms: form.symptoms,
          symptomDescription: form.symptomDescription,
          durationHours: parseInt(form.durationHours) || 1,
          hasChronicConditions: form.hasChronicConditions,
          chronicConditions: form.chronicConditions,
          hasAllergies: form.hasAllergies,
          allergies: form.allergies,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue');
      setResult(data);
      setStep('result');
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du dossier');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
    setStep('patient');
  }

  const steps: Step[] = ['patient', 'symptoms', 'location', 'confirm'];
  const stepLabels: Record<Step, string> = {
    patient: 'Patient',
    symptoms: 'Symptômes',
    location: 'Localisation',
    confirm: 'Confirmation',
    result: 'Résultat',
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <header className="bg-[#1a1a2e] text-white px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">QuelleUrgence — Tableau de bord opérateur</h1>
          <p className="text-sm text-gray-300">Historique des dossiers et création rapide d’un nouveau dossier.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
          <aside className="space-y-6">
            <section className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Historique</h2>
                  <p className="text-sm text-gray-500 mt-1">Filtrer par numéro de téléphone ou par ID dossier.</p>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <Field label="Téléphone">
                  <input
                    className="input"
                    type="tel"
                    value={historyPhone}
                    onChange={e => setHistoryPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </Field>
                <Field label="ID dossier">
                  <input
                    className="input"
                    value={historyId}
                    onChange={e => setHistoryId(e.target.value.toUpperCase())}
                    placeholder="QU-XXXXXX"
                  />
                </Field>
                <div className="flex gap-3">
                  <button className="btn-primary flex-1" onClick={handleSearch} disabled={historyLoading}>
                    Rechercher
                  </button>
                  <button className="btn-secondary flex-1" onClick={resetSearch}>
                    Réinitialiser
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {historyLoading ? (
                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">Chargement de l'historique...</div>
                ) : historyError ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{historyError}</div>
                ) : history.length === 0 ? (
                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Aucun dossier trouvé.</div>
                ) : (
                  <div className="space-y-3">
                    {history.map(dossier => (
                      <a
                        key={dossier.accessCode}
                        href={`/dossier/${encodeURIComponent(dossier.accessCode)}`}
                        className="block rounded-3xl border border-gray-200 p-4 hover:border-[#1a1a2e] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-gray-900">{dossier.accessCode}</p>
                          <p className="text-xs text-gray-500">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{dossier.patient.firstName} {dossier.patient.lastName}</p>
                        <p className="text-sm text-gray-500">{dossier.patient.phone || 'Téléphone non renseigné'}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Créer un nouveau dossier</h2>
                  <p className="text-sm text-gray-500 mt-1">Remplissez le formulaire en 4 étapes pour enregistrer un dossier.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#1a1a2e] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                  {stepLabels[step]}
                </span>
              </div>

              {step !== 'result' && (
                <nav className="flex gap-1 mb-8" aria-label="Étapes du formulaire">
                  {steps.map((s, i) => (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div
                        className={`flex-1 h-2 rounded-full transition-colors ${
                          steps.indexOf(step) >= i ? 'bg-[#1a1a2e]' : 'bg-gray-200'
                        }`}
                      />
                      {i < steps.length - 1 && <div className="w-1" />}
                    </div>
                  ))}
                </nav>
              )}

              {step === 'patient' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prénom" required>
                      <input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Jean" />
                    </Field>
                    <Field label="Nom" required>
                      <input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Âge" required>
                      <input className="input" type="number" min={0} max={120} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="45" />
                    </Field>
                    <Field label="Sexe" required>
                      <select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'homme' | 'femme' | 'autre' }))}>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                        <option value="autre">Autre</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Téléphone">
                    <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" />
                  </Field>
                  <Field label="Email" required>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@email.fr" />
                  </Field>
                  <button
                    className="btn-primary w-full mt-2"
                    disabled={!form.firstName || !form.lastName || !form.age || !form.email}
                    onClick={() => setStep('symptoms')}
                  >
                    Suivant →
                  </button>
                </div>
              )}

              {step === 'symptoms' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Symptômes (sélectionner tous ceux qui s'appliquent)</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_SYMPTOMS.map(s => (
                        <button
                          key={s}
                          onClick={() => toggleSymptom(s)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            form.symptoms.includes(s)
                              ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="Description détaillée des symptômes" required>
                    <textarea
                      className="input min-h-[100px] resize-none"
                      value={form.symptomDescription}
                      onChange={e => setForm(f => ({ ...f, symptomDescription: e.target.value }))}
                      placeholder="Décrivez les symptômes en détail : intensité, localisation, évolution..."
                    />
                  </Field>

                  <Field label="Depuis combien d'heures ?" required>
                    <input className="input" type="number" min={1} value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} placeholder="Ex : 3" />
                  </Field>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4" checked={form.hasChronicConditions} onChange={e => setForm(f => ({ ...f, hasChronicConditions: e.target.checked }))} />
                      <span className="text-sm text-gray-700">Antécédents médicaux / maladies chroniques</span>
                    </label>
                    {form.hasChronicConditions && (
                      <input className="input" value={form.chronicConditions} onChange={e => setForm(f => ({ ...f, chronicConditions: e.target.value }))} placeholder="Ex : diabète, hypertension, insuffisance cardiaque..." />
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4" checked={form.hasAllergies} onChange={e => setForm(f => ({ ...f, hasAllergies: e.target.checked }))} />
                      <span className="text-sm text-gray-700">Allergies connues</span>
                    </label>
                    {form.hasAllergies && (
                      <input className="input" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="Ex : pénicilline, aspirine, arachides..." />
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button className="btn-secondary flex-1" onClick={() => setStep('patient')}>← Retour</button>
                    <button
                      className="btn-primary flex-1"
                      disabled={!form.symptomDescription || !form.durationHours}
                      onClick={() => setStep('location')}
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}

              {step === 'location' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">La localisation permet de trouver les hôpitaux les plus proches du patient.</p>

                  {locating && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg text-blue-700">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Localisation en cours...
                    </div>
                  )}

                  {form.latitude && form.longitude && !locating && (
                    <div className="p-4 bg-green-50 rounded-lg text-green-700 text-sm">
                      ✓ Position obtenue : {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                    </div>
                  )}

                  <button onClick={locateUser} className="btn-secondary w-full" disabled={locating}>
                    {locating ? 'Localisation...' : '📍 Obtenir la position automatiquement'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">ou saisir manuellement</p>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Latitude">
                      <input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="48.8566" />
                    </Field>
                    <Field label="Longitude">
                      <input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="2.3522" />
                    </Field>
                  </div>

                  <div className="flex gap-3">
                    <button className="btn-secondary flex-1" onClick={() => setStep('symptoms')}>← Retour</button>
                    <button
                      className="btn-primary flex-1"
                      disabled={!form.latitude || !form.longitude}
                      onClick={() => setStep('confirm')}
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="space-y-6">
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Patient</h3>
                    <p className="font-medium">{form.firstName} {form.lastName}, {form.age} ans ({form.gender})</p>
                    <p className="text-sm text-gray-600">{form.email} · {form.phone}</p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Symptômes</h3>
                    {form.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {form.symptoms.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-600">{form.symptomDescription}</p>
                    <p className="text-sm text-gray-500">Durée : {form.durationHours}h{form.hasChronicConditions && ` · Antécédents : ${form.chronicConditions}`}{form.hasAllergies && ` · Allergies : ${form.allergies}`}</p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Localisation</h3>
                    <p className="text-sm text-gray-600">{parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}</p>
                  </section>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button className="btn-secondary flex-1" onClick={() => setStep('location')} disabled={loading}>← Retour</button>
                    <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyse en cours...
                        </span>
                      ) : 'Créer le dossier'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'result' && result && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
                    <h2 className="text-2xl font-bold text-gray-800">Dossier créé</h2>
                    <p className="text-gray-500 text-sm">{result.message}</p>

                    <div className="bg-gray-50 rounded-3xl p-6">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Code d'accès</p>
                      <p className="text-4xl font-bold tracking-widest text-[#1a1a2e]">{result.accessCode}</p>
                    </div>

                    {result.qrCodeDataUrl && (
                      <div className="flex flex-col items-center gap-2">
                        <img src={result.qrCodeDataUrl} alt="QR Code d'accès" className="w-48 h-48 rounded-xl" />
                        <p className="text-xs text-gray-400">QR Code à scanner par le médecin</p>
                      </div>
                    )}
                  </div>

                  <button className="btn-secondary w-full" onClick={reset}>
                    Nouveau dossier
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
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
          box-shadow: 0 0 0 3px rgba(26,26,46,0.08);
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
        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .btn-secondary:hover {
          border-color: #9ca3af;
        }
      `}</style>
      </div>
    </>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

