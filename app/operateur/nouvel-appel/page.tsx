'use client';

import { useEffect, useState } from 'react';
import { CreateOperatorCallInput } from '@/types/operator';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import OperatorCallForm from '@/components/operateur/OperatorCallForm';
import styles from './page.module.scss';

export default function NouvelAppelPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [operatorId, setOperatorId] = useState('');
  const [operatorLoading, setOperatorLoading] = useState(true);

  useEffect(() => {
    async function loadOperatorId() {
      try {
        const sb = getSupabaseBrowser();
        const { data, error: userError } = await sb.auth.getUser();
        if (userError) throw new Error(userError.message);
        const userId = data.user?.id;
        if (!userId) {
          throw new Error('Session expirée. Connectez-vous à nouveau.');
        }
        setOperatorId(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de récupérer l'opérateur connecté");
      } finally {
        setOperatorLoading(false);
      }
    }

    void loadOperatorId();
  }, []);

  const handleFormSubmit = async (callData: CreateOperatorCallInput) => {
    setError(null);
    setLoading(true);

    try {
      const sb = getSupabaseBrowser();
      const { data } = await sb.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('Session expirée. Reconnectez-vous.');
      }

      const response = await fetch('/api/operators/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
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

      {operatorLoading ? (
        <div className={styles.errorMessage}>Vérification de la session opérateur...</div>
      ) : !operatorId ? (
        <div className={styles.errorMessage}>Session opérateur introuvable. Reconnectez-vous.</div>
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
