import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { saveOperatorCall } from '@/lib/operatorCalls';
import { CreateOperatorCallInput } from '@/types/operator';

interface OperatorCallRow {
  id: string;
  operator_id: string;
  caller: unknown;
  location: unknown;
  event: unknown;
  vital_assessment: unknown;
  remarque_generale: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function toResponse(row: OperatorCallRow) {
  return {
    id: row.id,
    operatorId: row.operator_id,
    caller: row.caller,
    location: row.location,
    event: row.event,
    vitalAssessment: row.vital_assessment,
    remarqueGenerale: row.remarque_generale ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseLimit(raw: string | null): number {
  if (!raw) return 50;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(parsed, 1), 200);
}

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * POST /api/operators/calls
 * Enregistre un nouvel appel d'urgence depuis un opérateur connecté.
 */
export async function POST(request: NextRequest) {
  try {
    const operatorId = await getAuthenticatedUserId(request);
    if (!operatorId) {
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<CreateOperatorCallInput>;

    if (!body.caller || !body.location || !body.event || !body.vitalAssessment) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('operator_calls')
      .insert({
        operator_id: operatorId,
        caller: body.caller,
        location: body.location,
        event: body.event,
        vital_assessment: body.vitalAssessment,
        remarque_generale: body.remarqueGenerale ?? null,
      })
      .select(
        'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const localCall = saveOperatorCall({
      operatorId,
      caller: body.caller,
      location: body.location,
      event: body.event,
      vitalAssessment: body.vitalAssessment,
      remarqueGenerale: body.remarqueGenerale,
      status: body.status,
    });

    console.info('[Lien hopital unique]', localCall.hospitalLinkUrl);

    return NextResponse.json(
      {
        id: data.id,
        success: true,
        message: 'Appel enregistré avec succès',
        hospitalLinkUrl: localCall.hospitalLinkUrl,
        data: {
          ...toResponse(data as OperatorCallRow),
          hospitalLinkToken: localCall.hospitalLinkToken,
          hospitalLinkUrl: localCall.hospitalLinkUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'appel:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

/**
 * GET /api/operators/calls
 * Récupère les appels de l'opérateur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthenticatedUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
    }

    const requestedOperatorId = request.nextUrl.searchParams.get('operatorId');
    const operatorId =
      requestedOperatorId && requestedOperatorId === authUserId ? requestedOperatorId : authUserId;
    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

    const sb = getSupabaseAdmin();
    const { data, error, count } = await sb
      .from('operator_calls')
      .select(
        'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at',
        { count: 'exact' }
      )
      .eq('operator_id', operatorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        calls: (data ?? []).map((row) => toResponse(row as OperatorCallRow)),
        total: count ?? 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des appels:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
