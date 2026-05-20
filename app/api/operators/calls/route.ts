import { NextRequest, NextResponse } from 'next/server';
import { listOperatorCalls, saveOperatorCall } from '@/lib/operatorCalls';
import { CreateOperatorCallInput } from '@/types/operator';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
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

/**
 * POST /api/operators/calls
 * Enregistre un nouvel appel d'urgence depuis un opérateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateOperatorCallInput>;

    if (!body.operatorId) {
      return NextResponse.json({ error: 'operatorId est requis' }, { status: 400 });
    }

    if (!body.caller || !body.location || !body.event || !body.vitalAssessment) {
      return NextResponse.json(
        { error: 'Donnees incompletes' },
        { status: 400 }
      );
    }

    const callData: CreateOperatorCallInput = body;
    const savedCall = saveOperatorCall(callData);

    console.log('Nouvel appel enregistre:', {
      id: savedCall.id,
      operatorId: savedCall.operatorId,
      hospitalLinkUrl: savedCall.hospitalLinkUrl,
    });
    console.log(`Lien hopital unique: ${savedCall.hospitalLinkUrl}`);

    return NextResponse.json(
      {
        id: savedCall.id,
        success: true,
        message: 'Appel enregistre avec succes',
        hospitalLinkUrl: savedCall.hospitalLinkUrl,
        data: savedCall,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'appel:", error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const operatorId = request.nextUrl.searchParams.get('operatorId');
    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId est requis' }, { status: 400 });
    }

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
