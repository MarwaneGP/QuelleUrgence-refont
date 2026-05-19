export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  1: 'Non urgent',
  2: 'Semi-urgent',
  3: 'Urgent',
  4: 'Très urgent',
  5: 'Critique',
};

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#f59e0b',
  4: '#f97316',
  5: '#ef4444',
};

export const SPECIALTIES = [
  'cardiologie',
  'neurologie',
  'pneumologie',
  'gastro-entérologie',
  'orthopédie',
  'urgences générales',
  'pédiatrie',
  'gynécologie',
  'urologie',
  'dermatologie',
  'psychiatrie',
  'ophtalmologie',
  'ORL',
  'rhumatologie',
  'endocrinologie',
  'néphrologie',
  'chirurgie générale',
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export interface PatientInfo {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'homme' | 'femme' | 'autre';
  phone: string;
  email: string;
}

export interface SymptomForm {
  patient: PatientInfo;
  symptoms: string[];
  symptomDescription: string;
  durationHours: number;
  hasChronicConditions: boolean;
  chronicConditions: string;
  hasAllergies: boolean;
  allergies: string;
  latitude: number;
  longitude: number;
}

export interface TriageResult {
  urgencyLevel: UrgencyLevel;
  urgencyLabel: string;
  recommendedSpecialties: Specialty[];
  analysis: string;
  shouldGoToEmergency: boolean;
  recommendation: string;
}

export interface HospitalRecommendation {
  name: string;
  code: string;
  distance: number;
  waitTime?: number;
  totalPatients?: number;
  specialties: string[];
  urgencyScore: number;
  address?: string;
  coordinates?: [number, number];
}

export interface Dossier {
  id: string;
  accessCode: string;
  createdAt: string;
  patient: PatientInfo;
  symptoms: string[];
  symptomDescription: string;
  durationHours: number;
  chronicConditions: string;
  allergies: string;
  triage: TriageResult;
  hospitals: HospitalRecommendation[];
  qrCodeDataUrl: string;
  qrCodeUrl: string;
}

export interface CreateDossierRequest extends SymptomForm {}

export interface CreateDossierResponse {
  success: boolean;
  accessCode: string;
  qrCodeDataUrl: string;
  message: string;
}
