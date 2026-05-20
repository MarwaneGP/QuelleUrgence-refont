'use client';

import { useState } from 'react';
import { CreateOperatorCallInput } from '@/types/operator';
import OperatorCallForm from '@/components/operateur/OperatorCallForm';
import styles from './page.module.scss';

export default function NouvelAppelPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFormSubmit = async (callData: CreateOperatorCallInput) => {
    setError(null);
    setLoading(true);

    try {
      // TODO: Remplacer par le vrai ID de l'opérateur connecté
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

      const result = await response.json();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

      if (result.hospitalLinkUrl) {
        console.log(`Lien hopital unique: ${result.hospitalLinkUrl}`);
      }
      console.log('Appel enregistré avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Enregistrer un nouvel appel d'urgence</h1>
        <p>Remplissez le formulaire avec les informations du patient/victime</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          ✗ {error}
        </div>
      )}

      <OperatorCallForm
        operatorId="current-operator-id" // TODO: Récupérer depuis le contexte d'authentification
        onSubmit={handleFormSubmit}
        loading={loading}
        error={error}
        success={success}
      />
    </div>
  );
}
