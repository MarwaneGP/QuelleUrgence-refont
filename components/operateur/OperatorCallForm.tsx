import { useState } from 'react';
import { OperatorCall, CreateOperatorCallInput } from '@/types/operator';
import styles from './OperatorCallForm.module.scss';

export interface OperatorCallFormProps {
  onSubmit: (data: CreateOperatorCallInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<OperatorCall>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  operatorId: string;
}

const INCIDENT_TYPES = [
  'Malaise',
  'Traumatisme / chute',
  'Plaie / saignement',
  'Brûlure',
  'Intoxication',
  'Perte de conscience',
  'Convulsion',
  'Dyspnée',
  'Douleur thoracique',
  'Accident de la route',
  'Noyade',
  'Électrocution',
  'Allergique',
  'Autre',
];

const HOSPITAL_SERVICES = [
  'Urgences générales',
  'Cardiologie',
  'Neurologie',
  'Traumatologie',
  'Pédiatrie',
  'Gynécologie-Obstétrique',
  'Toxicologie',
  'Pneumologie',
  'Gastro-entérologie',
  'Chirurgie générale',
];

const CONSCIOUSNESS_STATES = [
  'Conscient et lucide',
  'Confus / désorienté',
  'Somnolent',
  'Inconscient',
  'Réactions aux stimuli',
];

const BREATHING_STATES = [
  'Respiration normale',
  'Respiration rapide (> 20/min)',
  'Respiration lente (< 12/min)',
  'Respiration difficile',
  'Arrêt respiratoire',
  'Bruits anormaux',
];

const BLEEDING_STATES = [
  'Aucun saignement',
  'Saignement léger',
  'Saignement modéré',
  'Saignement important',
  'Hémorragie',
];

const SPEECH_STATES = [
  'Parole normale',
  'Parole difficile',
  'Bégaiement',
  'Trouble du langage',
  'Incohérence',
  'Mutisme',
];

interface FormData {
  // Informations de l'appelant/victime
  telephone: string;
  nom: string;
  prenom: string;
  age: string;
  sexe: 'homme' | 'femme' | 'autre';

  // Localisation de l'urgence
  ville: string;
  adresse_rue_et_num: string;
  adresse_complements: string;

  // Nature de l'événement
  type_incident: string[];
  service_concerne_hopital: string[];
  nombre_personnes: string;
  depuis_quand: string;
  details_evenement: string;

  // État de la victime (Bilan vital)
  etat_conscience: string;
  etat_respiration: string;
  etat_saignement: string;
  etat_parole: string;

  // Remarque générale
  remarqueGenerale: string;
}

const INITIAL_FORM: FormData = {
  telephone: '',
  nom: '',
  prenom: '',
  age: '',
  sexe: 'homme',
  ville: '',
  adresse_rue_et_num: '',
  adresse_complements: '',
  type_incident: [],
  service_concerne_hopital: [],
  nombre_personnes: '1',
  depuis_quand: '',
  details_evenement: '',
  etat_conscience: '',
  etat_respiration: '',
  etat_saignement: '',
  etat_parole: '',
  remarqueGenerale: '',
};

export default function OperatorCallForm({
  onSubmit,
  onCancel,
  initialData,
  loading = false,
  error: externalError,
  success: externalSuccess,
  operatorId,
}: OperatorCallFormProps) {
  const [form, setForm] = useState<FormData>(
    initialData
      ? {
          telephone: initialData.caller?.telephone || '',
          nom: initialData.caller?.nom || '',
          prenom: initialData.caller?.prenom || '',
          age: String(initialData.caller?.age || ''),
          sexe: initialData.caller?.sexe || 'homme',
          ville: initialData.location?.ville || '',
          adresse_rue_et_num: initialData.location?.adresse_rue_et_num || '',
          adresse_complements: initialData.location?.adresse_complements || '',
          type_incident: initialData.event?.type_incident || [],
          service_concerne_hopital: initialData.event?.service_concerne_hopital || [],
          nombre_personnes: String(initialData.event?.nombre_personnes || '1'),
          depuis_quand: initialData.event?.depuis_quand || '',
          details_evenement: initialData.event?.details_evenement || '',
          etat_conscience: initialData.vitalAssessment?.etat_conscience || '',
          etat_respiration: initialData.vitalAssessment?.etat_respiration || '',
          etat_saignement: initialData.vitalAssessment?.etat_saignement || '',
          etat_parole: initialData.vitalAssessment?.etat_parole || '',
          remarqueGenerale: initialData.remarqueGenerale || '',
        }
      : INITIAL_FORM
  );

  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalSuccess, setInternalSuccess] = useState(false);

  const displayError = externalError || internalError;
  const displaySuccess = externalSuccess || internalSuccess;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (value: string, fieldName: 'type_incident' | 'service_concerne_hopital') => {
    setForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(value)
        ? prev[fieldName].filter(item => item !== value)
        : [...prev[fieldName], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInternalError(null);

    try {
      // Validation des champs obligatoires
      if (!form.telephone || !form.nom || !form.prenom) {
        throw new Error('Veuillez remplir les informations de l\'appelant');
      }
      if (!form.ville || !form.adresse_rue_et_num) {
        throw new Error('Veuillez remplir la localisation de l\'urgence');
      }
      if (form.type_incident.length === 0) {
        throw new Error('Veuillez sélectionner au moins un type d\'incident');
      }
      if (!form.etat_conscience || !form.etat_respiration || !form.etat_saignement || !form.etat_parole) {
        throw new Error('Veuillez compléter le bilan vital');
      }

      // Créer l'objet de données
      const callData: CreateOperatorCallInput = {
        operatorId,
        caller: {
          telephone: form.telephone,
          nom: form.nom,
          prenom: form.prenom,
          age: parseInt(form.age) || 0,
          sexe: form.sexe,
        },
        location: {
          ville: form.ville,
          adresse_rue_et_num: form.adresse_rue_et_num,
          adresse_complements: form.adresse_complements,
        },
        event: {
          type_incident: form.type_incident,
          service_concerne_hopital: form.service_concerne_hopital,
          nombre_personnes: parseInt(form.nombre_personnes) || 1,
          depuis_quand: form.depuis_quand,
          details_evenement: form.details_evenement,
        },
        vitalAssessment: {
          etat_conscience: form.etat_conscience,
          etat_respiration: form.etat_respiration,
          etat_saignement: form.etat_saignement,
          etat_parole: form.etat_parole,
        },
        remarqueGenerale: form.remarqueGenerale || undefined,
      };

      await onSubmit(callData);
      setInternalSuccess(true);
      setForm(INITIAL_FORM);

      // Réinitialiser le message de succès après 5 secondes
      setTimeout(() => setInternalSuccess(false), 5000);
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setInternalError(null);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {displaySuccess && (
        <div className={styles.successMessage}>
          ✓ Appel enregistré avec succès
        </div>
      )}

      {displayError && (
        <div className={styles.errorMessage}>
          ✗ {displayError}
        </div>
      )}

      {/* Informations de l'appelant/victime */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informations de l'appelant/victime</h2>

        <div className={styles.formGroup}>
          <label htmlFor="telephone">Téléphone *</label>
          <input
            type="tel"
            id="telephone"
            name="telephone"
            value={form.telephone}
            onChange={handleInputChange}
            placeholder="06 XX XX XX XX"
            required
          />
        </div>

        <div className={styles.twoColumns}>
          <div className={styles.formGroup}>
            <label htmlFor="nom">Nom *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={form.nom}
              onChange={handleInputChange}
              placeholder="Nom de famille"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="prenom">Prénom *</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={form.prenom}
              onChange={handleInputChange}
              placeholder="Prénom"
              required
            />
          </div>
        </div>

        <div className={styles.twoColumns}>
          <div className={styles.formGroup}>
            <label htmlFor="age">Âge</label>
            <input
              type="number"
              id="age"
              name="age"
              value={form.age}
              onChange={handleInputChange}
              placeholder="Âge en années"
              min="0"
              max="150"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sexe">Sexe</label>
            <select
              id="sexe"
              name="sexe"
              value={form.sexe}
              onChange={handleInputChange}
            >
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      </section>

      {/* Localisation de l'urgence */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Localisation de l'urgence</h2>

        <div className={styles.formGroup}>
          <label htmlFor="ville">Ville *</label>
          <input
            type="text"
            id="ville"
            name="ville"
            value={form.ville}
            onChange={handleInputChange}
            placeholder="Nom de la ville"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="adresse_rue_et_num">Rue et numéro *</label>
          <input
            type="text"
            id="adresse_rue_et_num"
            name="adresse_rue_et_num"
            value={form.adresse_rue_et_num}
            onChange={handleInputChange}
            placeholder="Ex: 123 rue de la Paix"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="adresse_complements">Compléments d'adresse</label>
          <input
            type="text"
            id="adresse_complements"
            name="adresse_complements"
            value={form.adresse_complements}
            onChange={handleInputChange}
            placeholder="Apt, bâtiment, lieu-dit, etc."
          />
        </div>
      </section>

      {/* Nature de l'événement */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Nature de l'événement</h2>

        <div className={styles.formGroup}>
          <label>Types d'incident * (cochez tous les éléments applicables)</label>
          <div className={styles.checkboxGrid}>
            {INCIDENT_TYPES.map(incident => (
              <label key={incident} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.type_incident.includes(incident)}
                  onChange={() => handleCheckboxChange(incident, 'type_incident')}
                />
                <span>{incident}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Services hospitaliers concernés * (cochez tous les éléments applicables)</label>
          <div className={styles.checkboxGrid}>
            {HOSPITAL_SERVICES.map(service => (
              <label key={service} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.service_concerne_hopital.includes(service)}
                  onChange={() => handleCheckboxChange(service, 'service_concerne_hopital')}
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.twoColumns}>
          <div className={styles.formGroup}>
            <label htmlFor="nombre_personnes">Nombre de personnes</label>
            <input
              type="number"
              id="nombre_personnes"
              name="nombre_personnes"
              value={form.nombre_personnes}
              onChange={handleInputChange}
              min="1"
              max="999"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="depuis_quand">Depuis quand / Durée *</label>
            <input
              type="text"
              id="depuis_quand"
              name="depuis_quand"
              value={form.depuis_quand}
              onChange={handleInputChange}
              placeholder="Ex: depuis 2h, depuis ce matin"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="details_evenement">Détails de l'événement *</label>
          <textarea
            id="details_evenement"
            name="details_evenement"
            value={form.details_evenement}
            onChange={handleInputChange}
            placeholder="Décrivez les circonstances de l'incident..."
            rows={4}
            required
          />
        </div>
      </section>

      {/* État de la victime (Bilan vital) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>État de la victime (Bilan vital)</h2>

        <div className={styles.formGroup}>
          <label htmlFor="etat_conscience">État de conscience *</label>
          <select
            id="etat_conscience"
            name="etat_conscience"
            value={form.etat_conscience}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Sélectionner --</option>
            {CONSCIOUSNESS_STATES.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="etat_respiration">État de respiration *</label>
          <select
            id="etat_respiration"
            name="etat_respiration"
            value={form.etat_respiration}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Sélectionner --</option>
            {BREATHING_STATES.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="etat_saignement">État de saignement *</label>
          <select
            id="etat_saignement"
            name="etat_saignement"
            value={form.etat_saignement}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Sélectionner --</option>
            {BLEEDING_STATES.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="etat_parole">État de parole *</label>
          <select
            id="etat_parole"
            name="etat_parole"
            value={form.etat_parole}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Sélectionner --</option>
            {SPEECH_STATES.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Remarque générale */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Remarque générale</h2>

        <div className={styles.formGroup}>
          <label htmlFor="remarqueGenerale">Notes supplémentaires</label>
          <textarea
            id="remarqueGenerale"
            name="remarqueGenerale"
            value={form.remarqueGenerale}
            onChange={handleInputChange}
            placeholder="Ajoutez toute information pertinente..."
            rows={3}
          />
        </div>
      </section>

      {/* Boutons d'action */}
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={loading}>
            Annuler
          </button>
        )}
        <button type="button" onClick={handleReset} className={styles.resetButton} disabled={loading}>
          Réinitialiser
        </button>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Enregistrement en cours...' : 'Enregistrer l\'appel'}
        </button>
      </div>
    </form>
  );
}
