'use client';

import { useState } from 'react';
import { CreateOperatorCallInput } from '@/types/operator';
import OperatorCallForm from '@/components/operateur/OperatorCallForm';
import styles from './page.module.scss';

export default function NouvelAppelPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const operatorId = process.env.NEXT_PUBLIC_OPERATOR_ID ?? '';

  const handleFormSubmit = async (callData: CreateOperatorCallInput) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/operators/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
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

      {error && <div className={styles.errorMessage}>x {error}</div>}

      {!operatorId ? (
        <div className={styles.errorMessage}>
          Variable manquante: configurez NEXT_PUBLIC_OPERATOR_ID dans .env
        </div>
      ) : (
        <OperatorCallForm
          operatorId={operatorId}
          onSubmit={handleFormSubmit}
          loading={loading}
          error={error}
          success={success}
        />
      )}
    </div>
  );
}



