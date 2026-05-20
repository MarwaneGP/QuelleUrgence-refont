"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import OperatorCallForm from '@/components/operateur/OperatorCallForm';
import { CreateOperatorCallInput } from '@/types/operator';

export default function OperateurPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFormSubmit = async (callData: CreateOperatorCallInput) => {
    setError(null);
    setLoading(true);

    try {
      // ID de l'opérateur connecté simulé
      const operatorId = 'current-operator-id';

      const response = await fetch('/api/operators/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...callData,
          operatorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

      console.log('Appel enregistré avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 pb-24 md:pb-8"
        tabIndex={-1}
      >
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-8 animate-fade-in">
          {/* Header section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Enregistrer un nouvel appel
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] font-semibold -mt-3">
              Remplissez les informations cliniques et de localisation transmises par l'appelant.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-[var(--danger-light)] border-l-4 border-[var(--danger)] text-[var(--danger)] rounded-[var(--border-radius-sm)] text-sm font-semibold">
              ✗ {error}
            </div>
          )}

          {/* Form */}
          <section>
            <OperatorCallForm
              operatorId="current-operator-id"
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error}
              success={success}
            />
          </section>
        </div>
      </main>
    </>
  );
}
