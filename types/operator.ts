export type OperatorRole = 'operator' | 'admin';

export interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: OperatorRole;
  createdAt: string;
  updatedAt: string;
}

export type OperatorPublic = Operator;

export interface CreateOperatorInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: OperatorRole;
}

export interface UpdateOperatorInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: OperatorRole;
}

// Types pour les appels d'urgence enregistrés par les opérateurs
export interface CallerInfo {
  telephone: string;
  nom: string;
  prenom: string;
  age: number;
  sexe: 'homme' | 'femme' | 'autre';
}

export interface EmergencyLocation {
  ville: string;
  adresse_rue_et_num: string;
  adresse_complements?: string;
  latitude?: number;
  longitude?: number;
}

export interface EventDetails {
  type_incident: string[]; // choix multiple
  service_concerne_hopital: string[]; // choix multiple
  nombre_personnes: number;
  depuis_quand: string; // durée ou description
  details_evenement: string;
}

export interface VitalAssessment {
  etat_conscience: string; // ex: conscient, inconscient, etc.
  etat_respiration: string; // ex: normal, difficile, arrêt, etc.
  etat_saignement: string; // ex: aucun, modéré, important, etc.
  etat_parole: string; // ex: normal, difficulté, silence, etc.
}

export interface OperatorCall {
  id?: string;
  operatorId: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'new' | 'in_progress' | 'closed';
  
  // Sections du formulaire
  caller: CallerInfo;
  location: EmergencyLocation;
  event: EventDetails;
  vitalAssessment: VitalAssessment;
  remarqueGenerale?: string;
}

export interface CreateOperatorCallInput extends Omit<OperatorCall, 'id' | 'createdAt' | 'updatedAt'> {}
