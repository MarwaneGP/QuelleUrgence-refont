import { CreateOperatorCallInput, OperatorCall } from '@/types/operator';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface StoredOperatorCall extends OperatorCall {
  id: string;
  createdAt: string;
  updatedAt: string;
  hospitalLinkToken: string;
  hospitalLinkUrl: string;
}

interface OperatorCallRow {
  id: string;
  operator_id: string;
  caller: unknown;
  location: unknown;
  event: unknown;
  vital_assessment: unknown;
  remarque_generale: string | null;
  status: 'new' | 'in_progress' | 'closed' | null;
  created_at: string;
  updated_at: string;
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

function sanitizeToken(token: string): string {
  return token.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

function buildHospitalLink(token: string): string {
  return `${getBaseUrl()}/hopitaux/lien/${encodeURIComponent(token)}`;
}

function toStoredOperatorCall(row: OperatorCallRow): StoredOperatorCall {
  return {
    id: row.id,
    operatorId: row.operator_id,
    caller: row.caller as StoredOperatorCall['caller'],
    location: row.location as StoredOperatorCall['location'],
    event: row.event as StoredOperatorCall['event'],
    vitalAssessment: row.vital_assessment as StoredOperatorCall['vitalAssessment'],
    remarqueGenerale: row.remarque_generale ?? undefined,
    status: row.status ?? 'new',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hospitalLinkToken: row.id,
    hospitalLinkUrl: buildHospitalLink(row.id),
  };
}

export function getHospitalLinkByCallId(callId: string): { hospitalLinkToken: string; hospitalLinkUrl: string } {
  const token = sanitizeToken(callId);
  return {
    hospitalLinkToken: token,
    hospitalLinkUrl: buildHospitalLink(token),
  };
}

export async function saveOperatorCall(input: CreateOperatorCallInput): Promise<StoredOperatorCall> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('operator_calls')
    .insert({
      operator_id: input.operatorId,
      caller: input.caller,
      location: input.location,
      event: input.event,
      vital_assessment: input.vitalAssessment,
      remarque_generale: input.remarqueGenerale ?? null,
      status: input.status ?? 'new',
    })
    .select(
      'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at'
    )
    .single();

  if (error) throw new Error(error.message);
  return toStoredOperatorCall(data as OperatorCallRow);
}

export async function getOperatorCallByHospitalToken(token: string): Promise<StoredOperatorCall | null> {
  const cleanToken = sanitizeToken(token);
  if (!cleanToken) return null;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('operator_calls')
    .select(
      'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at'
    )
    .eq('id', cleanToken)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116' || error.message.toLowerCase().includes('0 rows')) {
      return null;
    }
    throw new Error(error.message);
  }

  if (!data) return null;
  return toStoredOperatorCall(data as OperatorCallRow);
}

export async function listOperatorCalls(operatorId: string, limit = 50): Promise<StoredOperatorCall[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('operator_calls')
    .select(
      'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at'
    )
    .eq('operator_id', operatorId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toStoredOperatorCall(row as OperatorCallRow));
}
