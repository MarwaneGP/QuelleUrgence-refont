import { Dossier } from '@/types/triage';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

interface DossierRow {
  id: string;
  access_code: string;
  created_at: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_age: number;
  patient_gender: 'homme' | 'femme' | 'autre';
  patient_phone: string;
  patient_email: string;
  symptoms: string[];
  symptom_description: string;
  duration_hours: number;
  chronic_conditions: string;
  allergies: string;
  triage: unknown;
  hospitals: unknown;
  qr_code_data_url: string;
  qr_code_url: string;
  latitude: number | null;
  longitude: number | null;
  operator_id: string | null;
  operator_call_id: string | null;
}

export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `QU-${code}`;
}

function toDossier(row: DossierRow): Dossier {
  return {
    id: row.access_code,
    accessCode: row.access_code,
    createdAt: row.created_at,
    patient: {
      firstName: row.patient_first_name,
      lastName: row.patient_last_name,
      age: row.patient_age,
      gender: row.patient_gender,
      phone: row.patient_phone,
      email: row.patient_email,
    },
    symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    symptomDescription: row.symptom_description,
    durationHours: row.duration_hours,
    chronicConditions: row.chronic_conditions,
    allergies: row.allergies,
    triage: row.triage as Dossier['triage'],
    hospitals: row.hospitals as Dossier['hospitals'],
    qrCodeDataUrl: row.qr_code_data_url,
    qrCodeUrl: row.qr_code_url,
  };
}

export async function saveDossier(
  dossier: Dossier,
  options?: {
    latitude?: number;
    longitude?: number;
    operatorId?: string | null;
    operatorCallId?: string | null;
  }
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('dossiers').insert({
    access_code: dossier.accessCode,
    created_at: dossier.createdAt,
    patient_first_name: dossier.patient.firstName,
    patient_last_name: dossier.patient.lastName,
    patient_age: dossier.patient.age,
    patient_gender: dossier.patient.gender,
    patient_phone: dossier.patient.phone,
    patient_email: dossier.patient.email,
    symptoms: dossier.symptoms,
    symptom_description: dossier.symptomDescription,
    duration_hours: dossier.durationHours,
    chronic_conditions: dossier.chronicConditions,
    allergies: dossier.allergies,
    triage: dossier.triage,
    hospitals: dossier.hospitals,
    qr_code_data_url: dossier.qrCodeDataUrl,
    qr_code_url: dossier.qrCodeUrl,
    latitude: options?.latitude ?? null,
    longitude: options?.longitude ?? null,
    operator_id: options?.operatorId ?? null,
    operator_call_id: options?.operatorCallId ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function getDossier(accessCode: string): Promise<Dossier | null> {
  const sanitized = accessCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!sanitized) return null;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('dossiers')
    .select(
      'id, access_code, created_at, patient_first_name, patient_last_name, patient_age, patient_gender, patient_phone, patient_email, symptoms, symptom_description, duration_hours, chronic_conditions, allergies, triage, hospitals, qr_code_data_url, qr_code_url, latitude, longitude, operator_id, operator_call_id'
    )
    .eq('access_code', sanitized)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116' || error.message.toLowerCase().includes('0 rows')) {
      return null;
    }
    throw new Error(error.message);
  }
  if (!data) return null;
  return toDossier(data as DossierRow);
}

export async function getAllDossiers(): Promise<Dossier[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('dossiers')
    .select(
      'id, access_code, created_at, patient_first_name, patient_last_name, patient_age, patient_gender, patient_phone, patient_email, symptoms, symptom_description, duration_hours, chronic_conditions, allergies, triage, hospitals, qr_code_data_url, qr_code_url, latitude, longitude, operator_id, operator_call_id'
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toDossier(row as DossierRow));
}

export async function dossierExists(accessCode: string): Promise<boolean> {
  const sanitized = accessCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!sanitized) return false;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('dossiers')
    .select('access_code')
    .eq('access_code', sanitized)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116' || error.message.toLowerCase().includes('0 rows')) {
      return false;
    }
    throw new Error(error.message);
  }

  return Boolean(data);
}
